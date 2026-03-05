from typing import Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.get_api_fruits_graph import _get_api_fruits
from app.core.supervisor import invoke

router = APIRouter(prefix="/prompt")

class PromptRequest(BaseModel):
    prompt:str
    mode:Optional[Literal["api","db"]] = None

@router.post("")
def handle_prompt(request: PromptRequest):
    if request.mode == "api":
        response = _get_api_fruits(request.prompt)
    else:
        response = invoke(prompt=request.prompt)

    return response

@router.post("/api")
def handle_prompt(request: PromptRequest):
    response = invoke(prompt=request.prompt)
    return response