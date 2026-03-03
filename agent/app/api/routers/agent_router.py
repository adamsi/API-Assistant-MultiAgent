from fastapi import APIRouter
from pydantic import BaseModel

from app.core.agent import invoke

router = APIRouter(prefix="/prompt")

class PromptRequest(BaseModel):
    prompt:str

@router.post("")
def handle_prompt(request: PromptRequest):
    response = invoke(prompt=request.prompt)
    return response