from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from app.api.routers import agent_router
from app.api.routers import ingest_router

# will pass app object (web application) to uvicorn (the embedded server)
app = FastAPI()
app.include_router(agent_router.router)
app.include_router(ingest_router.router)