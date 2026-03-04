from langchain.agents import create_agent
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel

from app.core.generate_sql_graph import generate_sql
from app.core.rag import get_context
from app.core.api_toolkit import api_toolkit
from app.settings import settings


class Response(BaseModel):
    answer: str

agent = create_agent(model=settings.llm_model,
                     tools=[*api_toolkit, generate_sql])

SYSTEM_TEMPLATE = """
You are a helpful Fruits API assistant.
Use the provided RAG REFERENCE and available tools to answer accurately.

Tool rules:
- If a question can be answered using a specific Fruits API tool, use it.
- If no API tool directly satisfies the request, use `generate_sql` to query the database.

RAG REFERENCE:
{context}
"""

def invoke(prompt:str):
    context = get_context(prompt)
    response = agent.invoke({
        "messages": [
            SystemMessage(content=SYSTEM_TEMPLATE.format(context=context)),
            HumanMessage(content=prompt),
        ]
    })
    final_message = response["messages"][-1].content
    return final_message
