from fastapi import APIRouter
from pydantic import BaseModel

from app.core.utils.api_toolkit import get_api_entities_catalog
from app.core.graphs.db_agent.router_graph import route_prompt
from app.core.graphs.api_agent.get_api_entities_graph import get_api_entities

router = APIRouter(prefix="/prompt")


class UserPrompt(BaseModel):
    prompt: str


class UserApiPrompt(BaseModel):
    prompt: str
    entityType: str
    service: str


class ServiceApi(BaseModel):
    name: str
    entityTypes: list[str]


@router.post("/data")
def handle_data_prompt(request: UserPrompt):
    return route_prompt(request.prompt)


@router.post("/api")
def handle_api_prompt(request: UserApiPrompt):
    return get_api_entities(request.prompt, request.entityType, request.service)


@router.get("/api/catalog", response_model=list[ServiceApi])
def handle_api_catalog():
    return get_api_entities_catalog()
