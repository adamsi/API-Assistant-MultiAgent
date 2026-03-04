import uuid
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document
from langchain_postgres import PGVector

from app.settings import settings

embeddings = OpenAIEmbeddings(model=settings.embeddings_model)

vector_store = PGVector(
    connection=settings.db_url,
    embeddings=embeddings,
    collection_name="document_vector_store"
)

retriever = vector_store.as_retriever()


def get_context(prompt: str) -> str:
    docs = retriever.invoke(prompt)
    return "\n\n".join(d.page_content for d in docs)


def ingest(data: str):
    doc = Document(page_content=data)
    ids = [str(uuid.uuid4())]
    vector_store.add_documents([doc], ids=ids)