import asyncio
import operator
from typing import Annotated, List, Literal

from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END

from app.core.graphs.db_agent.generate_sql_graph import generate_sql
from app.core.utils.microservices_catalog import get_services_context
from app.core.utils.model import model


class PlanStep(BaseModel):
    service: str = Field(description="Microservice name")
    query: str = Field(description="Natural language query for that microservice")


class PastStep(BaseModel):
    service: str
    query: str
    result: str


class PlanExecute(BaseModel):
    input: str
    plan: List[PlanStep] = Field(default_factory=list)
    past_steps: Annotated[List[PastStep], operator.add] = Field(default_factory=list)
    response: str = ""


class Plan(BaseModel):
    steps: List[PlanStep] = Field(description="Steps to follow in order")


class ReplanOutput(BaseModel):
    kind: Literal["plan", "response"]
    steps: List[PlanStep] = Field(default_factory=list)
    response: str = ""


planner_prompt = """
For the given objective, come up with a simple step by step cross-service plan,
This plan should involve tasks that, if executed correctly, will yield the correct answer.
Do not add any superfluous steps.
The result of the final step should be the final answer.
Make sure that each step has all the information needed. Do not skip steps.
Each step must be one task for exactly one microservice.
If a later step depends on an earlier step, make that dependency explicit in the later step.
Use only the listed relations when moving from one microservice to another.
Do not join tables across microservices in a single step.

Available microservices:
{services}

Objective:
{objective}
"""

replanner_prompt = """
For the given objective, update the remaining cross-service plan,
The plan should involve tasks that, if executed correctly, will yield the correct answer.
Do not add any superfluous steps.
Make sure that each remaining step has all the information needed. Do not skip steps.
Return only the steps that still need to be done.
Each remaining step must be one task for exactly one microservice.
Use completed step results as inputs to later steps when needed.
Use only the listed relations when moving from one microservice to another.
When moving to another microservice, make the relation explicit in the step.
Do not join tables across microservices in a single step.
Do not repeat completed steps.
If the completed step results can fully and correctly answer the objective, return the final response.

Your objective was this:
{input}

Your original plan was this:
{plan}

You have currently done these steps:
{past_steps}

Available microservices:
{services}
"""


planner = model.with_structured_output(Plan)
replanner = model.with_structured_output(ReplanOutput)


async def plan_step(state: PlanExecute):
    plan = await planner.ainvoke(
        planner_prompt.format(
            services=get_services_context(),
            objective=state.input,
        )
    )
    print("PLAN:", [(s.service, s.query) for s in plan.steps])
    return {"plan": plan.steps}


async def execute_step(state: PlanExecute):
    if not state.plan:
        return {}

    step = state.plan[0]
    print(f"\nEXECUTE: service={step.service}, query={step.query}")

    result = generate_sql(step.query, step.service)

    print("STEP RESULT: " + result)

    return {
        "past_steps": [
            PastStep(
                service=step.service,
                query=step.query,
                result=result,
            )
        ],
        "plan": state.plan[1:],
    }


async def replan_step(state: PlanExecute):
    output = await replanner.ainvoke(
        replanner_prompt.format(
            input=state.input,
            services=get_services_context(),
            plan=state.plan,
            past_steps=[step.model_dump() for step in state.past_steps],
        )
    )

    if output.kind == "response":
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
