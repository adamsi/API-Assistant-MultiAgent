from fastapi import APIRouter
from pydantic import BaseModel

from app.core.plan_and_execute import plan_and_execute
from app.core.todo.get_api_entities_graph import get_api_entities

router = APIRouter(prefix="/prompt")

class PromptRequest(BaseModel):
    prompt:str

@router.post("/data")
def handle_data_prompt(request: PromptRequest):
      return plan_and_execute(request.prompt)

@router.post("/fruits")
def handle_fruits_prompt(request: PromptRequest):
    return get_api_entities(request.prompt)