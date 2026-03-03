from fastapi import APIRouter
from pydantic import BaseModel

from app.core.rag import ingest

router = APIRouter(prefix="/ingest")

class IngestRequest(BaseModel):
    data:str

@router.post("")
def handle_ingest(request: IngestRequest):
    ingest(data=request.data)
    return "ingested"