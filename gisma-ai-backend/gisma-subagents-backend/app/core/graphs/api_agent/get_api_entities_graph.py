import uuid
from typing import List

from langchain_core.messages import AIMessage
from langgraph.constants import START
from langgraph.graph import StateGraph, MessagesState
from pydantic import BaseModel, Field

from app.core.graphs.api_agent.api_toolkit import get_entity_by_name
from app.core.graphs.db_agent.plan_and_execute_graph import plan_and_execute
from app.core.utils.model import model

gisma_primary_key = "name"

class ApiEntitiesState(MessagesState):
    filter: str
    entity_type: str
    ids_to_fetch: List[str]
    final_entities: List[dict]


class EntityIds(BaseModel):
    ids: List[str] = Field(default_factory=list, description="Extracted entity names")


def generate_db_ids(state: ApiEntitiesState):
    # artificial tool call
    tool_call = {
        "name": "plan_and_execute",
        "args": {},
        "id": str(uuid.uuid4()),
        "type": "tool_call",
    }
    tool_call_message = AIMessage(content="", tool_calls=[tool_call])
    planning_prompt = (
        f"get {gisma_primary_key} column of {state['entity_type']} "
        f"which {state['filter']}"
    )
    sql_generate_response = plan_and_execute(planning_prompt)
    tool_message = AIMessage(content=sql_generate_response)

    return {"messages": [tool_call_message, tool_message]}


build_ids_to_fetch_system_prompt = """
You are an agent designed to extract entity names from text.

Given an input that may contain a free-form list of entity names for the requested entity type,
extract only the entity names.

Rules:
- Include only names that match the requested entity type.
- Do not include explanations or extra text.
- If no names are found, return an empty list.
"""

ids_extractor = model.with_structured_output(EntityIds)


def build_ids_to_fetch(state: ApiEntitiesState):
    free_text_ids = state["messages"][-1].content
    system_message = {
        "role": "system",
        "content": (
            build_ids_to_fetch_system_prompt
            + f"\nRequested entity type: {state['entity_type']}"
        ),
    }
    user_message = {"role": "user", "content": free_text_ids}
    response = ids_extractor.invoke([system_message, user_message])
    return {
        "ids_to_fetch": response.ids,
        "messages": [AIMessage(content=str(response.ids))],
    }


def fetch_api_entities(state: ApiEntitiesState):
    entities = [
        get_entity_by_name(_id, state["entity_type"])
        for _id in state["ids_to_fetch"]
    ]
    return {"final_entities": entities}

builder = StateGraph(ApiEntitiesState)
builder.add_node(generate_db_ids)
builder.add_node(build_ids_to_fetch)
builder.add_node(fetch_api_entities)

builder.add_edge(START, "generate_db_ids")
builder.add_edge("generate_db_ids", "build_ids_to_fetch")
builder.add_edge("build_ids_to_fetch", "fetch_api_entities")

agent = builder.compile()


def get_api_entities(_filter: str, entity_type: str):
    print(f"get_api_entities(filter={_filter}, entity_type={entity_type}) called.")
    final_state = agent.invoke({"filter": _filter, "entity_type": entity_type})
    return final_state["final_entities"]
