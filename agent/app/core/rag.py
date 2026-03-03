import uuid
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
from app.settings import settings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

vector_store = PineconeVectorStore(
    index_name=settings.pinecone_index,
    embedding=embeddings
)

retriever = vector_store.as_retriever()


def get_context(prompt: str) -> str:
    docs = retriever.invoke(prompt)
    return "\n\n".join(d.page_content for d in docs)


def ingest(data: str):
    doc = Document(page_content=data)
    ids = [str(uuid.uuid4())]
    vector_store.add_documents([doc], ids=ids)