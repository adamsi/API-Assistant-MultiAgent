import asyncio
import operator
from typing import Annotated, List, Literal

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

        relations = config.get("relations", [])
        if relations:
            lines.append("  relations:")
            for relation in relations:
                lines.append(f"  - {relation}")

    return "\n".join(lines)


SERVICES_DESCRIPTION = build_services_description()


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
Create the smallest correct plan for the objective.

Rules:
- Use one microservice if it alone can fully answer the request.
- Use multiple microservices only when the request requires combining or transferring data between services.
- Each step must use exactly one microservice.
- Never join tables from different microservices.
- Use the listed relations only when moving data between services.
- In cross-service steps, mention the exact field match from the relations.
- Do not fetch data the user did not ask for.
- If later steps depend on earlier steps, those later steps must use values obtained from earlier step results.

Available microservices:
{services}

Objective:
{objective}
"""

replanner_prompt = """
Update the remaining plan using the completed steps.

Rules:.
- If the objective can already be produced from completed step results, return the final response.
- Otherwise, return only the remaining needed steps.
- Stay in one microservice only if it can fully answer the request.
- Use multiple microservices when the request requires combining or transferring data between services.
- Each step must use exactly one microservice.
- Never join tables from different microservices.
- Use the listed relations only when moving data between services.
- In cross-service steps, mention the exact field match from the relations.
- Before moving to another microservice, first fetch the table and field values needed for the relation to that next microservice.
- Use values found in completed step results as input to later steps.
- If a needed list of ids, refs, or codes already appears in completed step results, use that list in the next step instead of creating a cross-service join.
- Do not repeat completed steps.
- Do not add exploratory steps.

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
            services=SERVICES_DESCRIPTION,
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