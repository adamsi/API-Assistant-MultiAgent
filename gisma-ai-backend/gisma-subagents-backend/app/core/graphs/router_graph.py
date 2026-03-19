import asyncio
from typing import Literal

from pydantic import BaseModel, Field
from langgraph.graph import END, START, StateGraph

from app.core.graphs.generate_sql_graph import generate_sql
from app.core.graphs.plan_and_execute_graph import _plan_and_execute
from app.core.utils.microservices_catalog import get_services_context
from app.core.utils.model import model


class RouterState(BaseModel):
    input: str
    route: Literal["single_service", "cross_service"] = "single_service"
    service: str = ""
    response: str = ""


class RouterDecision(BaseModel):
    route: Literal["single_service", "cross_service"] = Field(
        description="Choose single_service when one microservice can answer the request. Choose cross_service only when data must move across services."
    )
    service: str = Field(
        default="",
        description="Required when route is single_service. Must be one of the listed microservice names. Leave empty for cross_service.",
    )


router_prompt = """
Route the user request to either one microservice or a cross-service workflow.

Choose single_service when one microservice can answer the request on its own.
Choose cross_service only when the answer requires combining data from multiple microservices or using a listed relation to move from one service to another.

For single_service, return the exact microservice name.
For cross_service, leave service empty.

Available microservices:
{services}

User request:
{input}
"""


router = model.with_structured_output(RouterDecision)


async def classify_route(state: RouterState):
    decision = await router.ainvoke(
        router_prompt.format(
            services=get_services_context(),
            input=state.input,
        )
    )
    print(f"DECISION is: {decision}")
    return {
        "route": decision.route,
        "service": decision.service,
    }


def route_after_classification(state: RouterState):
    return state.route


def run_single_service(state: RouterState):
    return {
        "response": generate_sql(state.input, state.service),
    }


async def run_cross_service(state: RouterState):
    result = await _plan_and_execute(state.input)
    return {
        "response": result.get("response", ""),
    }


builder = StateGraph(RouterState)

builder.add_node("classify", classify_route)
builder.add_node("single_service", run_single_service)
builder.add_node("cross_service", run_cross_service)

builder.add_edge(START, "classify")
builder.add_conditional_edges(
    "classify",
    route_after_classification,
    {
        "single_service": "single_service",
        "cross_service": "cross_service",
    },
)
builder.add_edge("single_service", END)
builder.add_edge("cross_service", END)

app = builder.compile()


async def _route_prompt(user_prompt: str):
    return await app.ainvoke({"input": user_prompt})


def route_prompt(user_prompt: str) -> str:
    result = asyncio.run(_route_prompt(user_prompt))
    return result.get("response", "")
