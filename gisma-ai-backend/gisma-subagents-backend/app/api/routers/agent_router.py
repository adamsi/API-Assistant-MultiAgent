from fastapi import APIRouter
from pydantic import BaseModel

from app.core.graphs.db_agent.router_graph import route_prompt
from app.core.graphs.api_agent.get_api_entities_graph import get_api_entities

router = APIRouter(prefix="/prompt")


class UserPrompt(BaseModel):
    prompt: str


class UserApiPrompt(BaseModel):
    prompt: str
    entityType: str


@router.post("/data")
def handle_data_prompt(request: UserPrompt):
    return route_prompt(request.prompt)


@router.post("/api")
def handle_api_prompt(request: UserApiPrompt):
    return get_api_entities(request.prompt, request.entityType)
