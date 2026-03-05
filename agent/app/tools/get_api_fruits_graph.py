import uuid
from typing import List
import ast

from langchain_core.messages import AIMessage
from langgraph.constants import START

from langgraph.graph import StateGraph, MessagesState

from app.core.api_toolkit import _get_fruit_by_name
from app.core.generate_sql_graph import _generate_sql
from app.core.model import model

gisma_primary_key = "name"

class ApiFruitsState(MessagesState):
    filter: str
    ids_to_fetch:List[str]
    final_entities:List[dict]

def generate_db_ids(state: ApiFruitsState):
    # artificial tool call
    tool_call = {
        "name": "generate_sql",
        "args": {},
        "id": str(uuid.uuid4()),
        "type": "tool_call",
    }
    tool_call_message = AIMessage(content="", tool_calls=[tool_call])
    sql_generate_prompt = f"get {gisma_primary_key} column of fruits which {state['filter']}"
    sql_generate_response = _generate_sql(sql_generate_prompt)
    tool_message = AIMessage(content=sql_generate_response)

    return {"messages": [tool_call_message, tool_message]}


build_ids_to_fetch_system_prompt = """
You are an agent designed to extract fruit names from text.

Given an input that may contain a free-form list of fruit names,
convert them into a Python list of strings.

Output format:
['name1', 'name2', ...]

Rules:
- Include only the fruit names.
- Do not include explanations or extra text.
- If no names are found, return [].
"""

def build_ids_to_fetch(state: ApiFruitsState):
    free_text_ids = state["messages"][-1].content
    system_message = {"role": "system", "content": build_ids_to_fetch_system_prompt}
    user_message = {"role": "user", "content": free_text_ids}
    response = model.invoke([system_message, user_message])
    ids_to_fetch = parse_ids_list(response.content)
    return {"messages":[response], "ids_to_fetch": ids_to_fetch}

def parse_ids_list(ids_list: str):
    try:
        result = ast.literal_eval(ids_list)
        if isinstance(result, list) and all(isinstance(x, str) for x in result):
            return result
    except Exception:
        pass
    return []

def get_api_entities(state: ApiFruitsState):
    entities = [_get_fruit_by_name(_id) for _id in state["ids_to_fetch"]]
    return {"final_entities": entities}

builder = StateGraph(ApiFruitsState)
builder.add_node(generate_db_ids)
builder.add_node(build_ids_to_fetch)
builder.add_node(get_api_entities)

builder.add_edge(START, "generate_db_ids")
builder.add_edge("generate_db_ids", "build_ids_to_fetch")
builder.add_edge("build_ids_to_fetch", "get_api_entities")

agent = builder.compile()

def get_api_fruits_(_filter: str):
    print(f"get_api_fruits({_filter}) called.")
    final_state = agent.invoke({"filter": _filter})
    return final_state["final_entities"]