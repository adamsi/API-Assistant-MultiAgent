import uuid
from typing import Literal

from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_community.utilities import SQLDatabase
from langchain.messages import AIMessage
from langgraph.graph import END, START, MessagesState, StateGraph

from app.core.utils.microservices_catalog import MICROSERVICES_CATALOG
from app.core.utils.model import model


# Per-microservice DB initialization
DBS_BY_SERVICE: dict[str, SQLDatabase] = {}
DB_TOOLKITS_BY_SERVICE: dict[str, SQLDatabaseToolkit] = {}
DB_TOOLS_BY_SERVICE: dict[str, list] = {}

LIST_TABLES_TOOL_BY_SERVICE = {}
GET_SCHEMA_TOOL_BY_SERVICE = {}
RUN_QUERY_TOOL_BY_SERVICE = {}

def init_db_tools():
    print("--- MICROSERVICES ---")
    for service_name, service_config in MICROSERVICES_CATALOG.items():
        db = SQLDatabase.from_uri(service_config["db_url"],
                                  schema=service_config.get("schema"),
                                  include_tables=service_config["tables"])
        db_toolkit = SQLDatabaseToolkit(db=db, llm=model)
        db_tools = db_toolkit.get_tools()
        DBS_BY_SERVICE[service_name] = db
        DB_TOOLKITS_BY_SERVICE[service_name] = db_toolkit
        DB_TOOLS_BY_SERVICE[service_name] = db_tools
        LIST_TABLES_TOOL_BY_SERVICE[service_name] = next(
            tool for tool in db_tools if tool.name == "sql_db_list_tables"
        )
        GET_SCHEMA_TOOL_BY_SERVICE[service_name] = next(
            tool for tool in db_tools if tool.name == "sql_db_schema"
        )
        RUN_QUERY_TOOL_BY_SERVICE[service_name] = next(
            tool for tool in db_tools if tool.name == "sql_db_query"
        )
        print(f"\n=== {service_name} ===")


# Graph shared state
class SQLGenerateState(MessagesState):
    microservice_name: str


def get_service_name(state: SQLGenerateState) -> str:
    service_name = state["microservice_name"]
    if service_name not in MICROSERVICES_CATALOG:
        raise ValueError(f"Unknown microservice: {service_name}")
    return service_name


def list_tables(state: SQLGenerateState):
    service_name = get_service_name(state)
    list_tables_tool = LIST_TABLES_TOOL_BY_SERVICE[service_name]

    tool_call = {
        "name": "sql_db_list_tables",
        "args": {},
        "id": str(uuid.uuid4()),
        "type": "tool_call",
    }
    tool_call_message = AIMessage(content="", tool_calls=[tool_call])

    tool_message = list_tables_tool.invoke(tool_call)
    response = AIMessage(content=f"Available tables: {tool_message.content}")

    return {"messages": [tool_call_message, tool_message, response]}


def call_get_schema(state: SQLGenerateState):
    service_name = get_service_name(state)
    get_schema_tool = GET_SCHEMA_TOOL_BY_SERVICE[service_name]

    llm_with_tools = model.bind_tools([get_schema_tool], tool_choice="any")
    response = llm_with_tools.invoke(state["messages"])

    return {"messages": [response]}


def get_schema(state: SQLGenerateState):
    service_name = get_service_name(state)
    get_schema_tool = GET_SCHEMA_TOOL_BY_SERVICE[service_name]

    last_message = state["messages"][-1]
    tool_messages = []

    for tool_call in last_message.tool_calls:
        tool_message = get_schema_tool.invoke(tool_call)
        tool_messages.append(tool_message)

    return {"messages": tool_messages}


generate_query_system_prompt = """
You are an agent designed to interact with a SQL database.
Given an input question, create a syntactically correct {dialect} query to run,
then look at the results of the query and return the answer. Unless the user
specifies a specific number of examples they wish to obtain, always limit your
query to at most {top_k} results.

You can order the results by a relevant column to return the most interesting
examples in the database.

DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
"""


def generate_query(state: SQLGenerateState):
    service_name = get_service_name(state)
    run_query_tool = RUN_QUERY_TOOL_BY_SERVICE[service_name]
    db = DBS_BY_SERVICE[service_name]

    system_message = {
        "role": "system",
        "content": generate_query_system_prompt.format(
            dialect=db.dialect,
            top_k=100,
        ),
    }

    llm_with_tools = model.bind_tools([run_query_tool])
    response = llm_with_tools.invoke([system_message] + state["messages"])

    if response.tool_calls:
        args = response.tool_calls[0]["args"]
        print(f"[{service_name}] SQL query: {args['query']}")

    return {"messages": [response]}


check_query_system_prompt = """
You are a SQL expert with a strong attention to detail.
Double check the {dialect} query for common mistakes, including:
- Data type mismatch in predicates
- Properly quoting identifiers
- Using the correct number of arguments for functions
- Casting to the correct data type
- Using the proper columns for joins

If there are any of the above mistakes, rewrite the query. If there are no mistakes,
just reproduce the original query.

You will call the appropriate tool to execute the query after running this check.
"""


def check_query(state: SQLGenerateState):
    service_name = get_service_name(state)
    run_query_tool = RUN_QUERY_TOOL_BY_SERVICE[service_name]
    db = DBS_BY_SERVICE[service_name]

    system_message = {
        "role": "system",
        "content": check_query_system_prompt.format(dialect=db.dialect),
    }

    tool_call = state["messages"][-1].tool_calls[0]
    user_message = {"role": "user", "content": tool_call["args"]["query"]}

    llm_with_tools = model.bind_tools([run_query_tool], tool_choice="any")
    response = llm_with_tools.invoke([system_message, user_message])
    response.id = state["messages"][-1].id

    return {"messages": [response]}


def run_query(state: SQLGenerateState):
    service_name = get_service_name(state)
    run_query_tool = RUN_QUERY_TOOL_BY_SERVICE[service_name]

    last_message = state["messages"][-1]
    tool_messages = []

    for tool_call in last_message.tool_calls:
        tool_message = run_query_tool.invoke(tool_call)
        tool_messages.append(tool_message)

    return {"messages": tool_messages}


def should_continue(state: SQLGenerateState) -> Literal[END, "check_query"]:
    messages = state["messages"]
    last_message = messages[-1]
    if not last_message.tool_calls:
        return END
    return "check_query"


# Graph
builder = StateGraph(SQLGenerateState)

builder.add_node("list_tables", list_tables)
builder.add_node("call_get_schema", call_get_schema)
builder.add_node("get_schema", get_schema)
builder.add_node("generate_query", generate_query)
builder.add_node("check_query", check_query)
builder.add_node("run_query", run_query)

builder.add_edge(START, "list_tables")
builder.add_edge("list_tables", "call_get_schema")
builder.add_edge("call_get_schema", "get_schema")
builder.add_edge("get_schema", "generate_query")
builder.add_conditional_edges("generate_query", should_continue)
builder.add_edge("check_query", "run_query")
builder.add_edge("run_query", "generate_query")

agent = builder.compile()


def generate_sql(text: str, microservice_name: str):
    print(f"generate_sql(text={text}, microservice_name={microservice_name}) called.")

    if microservice_name not in MICROSERVICES_CATALOG:
        raise ValueError(
            f"Unknown microservice '{microservice_name}'. "
            f"Expected one of: {list(MICROSERVICES_CATALOG.keys())}"
        )

    last_message = None
    for step in agent.stream(
        {
            "microservice_name": microservice_name,
            "messages": [{"role": "user", "content": text}],
        },
        stream_mode="values",
    ):
        last_message = step["messages"][-1]

    return last_message.content
