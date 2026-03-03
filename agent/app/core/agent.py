from langchain.agents import create_agent
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel

from app.core.rag import get_context


class Response(BaseModel):
    answer: str

agent = create_agent(model='gpt-4o',
                     tools=[])

SYSTEM_TEMPLATE = """
You are a helpful Fruits API assistant.
Use the provided RAG CONTEXT and available tools to answer accurately.
If the answer is not found in the context or tools, say you don't know.

RAG CONTEXT:
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
