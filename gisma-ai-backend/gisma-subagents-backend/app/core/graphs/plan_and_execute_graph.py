import asyncio
import operator
from typing import Annotated, List, Literal

from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END

from app.core.graphs.generate_sql_graph import generate_sql
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
Create the smallest correct cross-service plan for the objective.

Rules:
- This workflow is only for cross-service requests.
- The user may write in Hebrew, but the plan must use English canonical terms from the aliases.
- Return only the steps needed to move through multiple microservices.
- Each step must use exactly one microservice.
- The steps must be ordered.
- Later steps must explicitly depend on values produced by earlier steps.
- Never join tables from different microservices.
- Use the listed relations only when moving data between services.
- When moving to another microservice, mention the field match from the listed relations in the step query.
- Do not fetch data the user did not ask for.

Available microservices:
{services}

Objective:
{objective}
"""

replanner_prompt = """
Update the remaining cross-service plan using the completed steps.

Rules:
- This workflow is only for cross-service requests.
- The user may write in Hebrew, but all remaining steps must use English canonical terms from the aliases.
- Prefer exact alias matches over guessed schema terms.
- If the completed step results can fully answer the objective, return the final response.
- Otherwise, return only the remaining needed steps.
- Each step must use exactly one microservice.
- Never join tables from different microservices.
- Use the listed relations only when moving data between services.
- Before moving to another microservice, first fetch the values needed for the relation to that next microservice.
- When moving to another microservice, mention the field match from the listed relations in the step query.
- Use values found in completed step results as input to later steps.
- Do not repeat completed steps.
- Do not add exploratory steps.
- Return `response` only when the work is complete. Otherwise return `plan` with at least one remaining step.

Objective:
{input}

Available microservices:
{services}

Remaining plan:
{plan}

Completed steps:
{past_steps}
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
