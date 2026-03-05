from langchain.agents import create_agent
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel

from app.core.generate_sql_graph import generate_sql
from app.core.rag import get_context
from app.settings import settings


class Response(BaseModel):
    answer: str

agent = create_agent(model=settings.llm_model,
                     tools=[generate_sql])

SYSTEM_TEMPLATE = """
You are a helpful Fruits API assistant.
if the answer requires data fetching or is not in RAG REFERENCE
call 'generate_sql` tool (retrieves data from the database).
if you're not sure, call 'generate_sql' tool.

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
