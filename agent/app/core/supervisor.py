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
- If there is a **100% semantic match** between the user request and one of the API tools, use that API tool.
- If there is **no exact match** with any API tool capability, you MUST use the `generate_sql` tool to retrieve the data from the database.

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
