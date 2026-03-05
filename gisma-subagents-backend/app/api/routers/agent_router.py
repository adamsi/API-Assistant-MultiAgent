from fastapi import APIRouter
from pydantic import BaseModel

from app.core.generate_sql_graph import generate_sql
from app.core.get_api_fruits_graph import get_api_fruits

router = APIRouter(prefix="/prompt")

class PromptRequest(BaseModel):
    prompt:str

@router.post("/data")
def handle_data_prompt(request: PromptRequest):
      return generate_sql(request.prompt)

@router.post("/fruits")
def handle_fruits_prompt(request: PromptRequest):
    return get_api_fruits(request.prompt)