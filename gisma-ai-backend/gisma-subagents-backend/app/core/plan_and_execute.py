import asyncio
import operator
from typing import Annotated, List, Tuple, Literal

from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END

from app.core.generate_sql_graph import generate_sql
from app.core.microservices_catalog import MICROSERVICES_CATALOG
from app.core.model import model


def build_services_description() -> str:
    lines = []
    for service_name, config in MICROSERVICES_CATALOG.items():
        tables = ", ".join(config["tables"])
        lines.append(f"- {service_name}: tables {tables}")
    return "\n".join(lines)


SERVICES_DESCRIPTION = build_services_description()


class PlanStep(BaseModel):
    service: str = Field(description="Microservice name")
    query: str = Field(description="Natural language query for that microservice")


class PlanExecute(BaseModel):
    input: str
    plan: List[PlanStep] = Field(default_factory=list)
    past_steps: Annotated[List[Tuple[str, str]], operator.add] = Field(default_factory=list)
    response: str = ""


class Plan(BaseModel):
    steps: List[PlanStep] = Field(description="Steps to follow in order")


class ReplanOutput(BaseModel):
    type: Literal["plan", "response"]
    steps: List[PlanStep] = Field(default_factory=list)
    response: str = ""


planner_prompt = """
For the given objective, come up with a simple step by step plan.
This plan should involve individual tasks that, if executed correctly, will yield the correct answer.
Do not add unnecessary steps.
The result of the final step should be enough to answer the user.
Each step must contain:
- service: one of the available microservices
- query: the natural language query to send to that microservice

Available microservices:
{services}

Objective:
{objective}
"""

replanner_prompt = """
For the given objective, come up with a simple step by step plan.
This plan should involve individual tasks that, if executed correctly, will yield the correct answer.
Do not add unnecessary steps.

Your objective was this:
{input}

Available microservices:
{services}

Your original remaining plan was this:
{plan}

You have currently done the following steps:
{past_steps}

Update your plan accordingly.
If no more steps are needed and you can return to the user, then respond with the final response.
Otherwise, return only the steps that still need to be done.
Do not return previously completed steps.

Return:
- type="response" and fill response when the answer is ready
- type="plan" and fill steps when more work is needed
"""


planner = model.with_structured_output(Plan)
replanner = model.with_structured_output(ReplanOutput)


async def plan_step(state: PlanExecute):
    plan = await planner.ainvoke(
        planner_prompt.format(
            services=SERVICES_DESCRIPTION,
            objective=state.input,
        )
    )
    print("PLAN:", [(s.service, s.query) for s in plan.steps])
    return {"plan": plan.steps}


async def execute_step(state: PlanExecute):
    if not state.plan:
        return {}

    step = state.plan[0]
    result = generate_sql(step.query, step.service)

    return {
        "past_steps": [(f"{step.service}: {step.query}", result)],
        "plan": state.plan[1:],
    }


async def replan_step(state: PlanExecute):
    output = await replanner.ainvoke(
        replanner_prompt.format(
            input=state.input,
            services=SERVICES_DESCRIPTION,
            plan=state.plan,
            past_steps=state.past_steps,
        )
    )

    if output.type == "response":
        return {"response": output.response}

    return {"plan": output.steps}


def should_end(state: PlanExecute):
    return "True" if state.response else "False"


builder = StateGraph(PlanExecute)

builder.add_node("planner", plan_step)
builder.add_node("agent", execute_step)
builder.add_node("replan", replan_step)

builder.add_edge(START, "planner")
builder.add_edge("planner", "agent")
builder.add_edge("agent", "replan")

builder.add_conditional_edges(
    "replan",
    should_end,
    {
        "True": END,
        "False": "agent",
    },
)

app = builder.compile()


async def _plan_and_execute(user_prompt: str):
    return await app.ainvoke(
        {"input": user_prompt},
        config={"recursion_limit": 20},
    )


def plan_and_execute(user_prompt: str) -> str:
    result = asyncio.run(_plan_and_execute(user_prompt))
    return result.get("response", "")