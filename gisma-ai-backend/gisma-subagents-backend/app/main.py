from dotenv import load_dotenv

from app.core.graphs.generate_sql_graph import init_db_tools
from app.core.utils.microservices_catalog import init_microservices_catalog

load_dotenv()

from fastapi import FastAPI
from app.api.routers import agent_router

# will pass app object (web application) to uvicorn (the embedded server)
app = FastAPI()
app.include_router(agent_router.router)

@app.on_event("startup")
def init():
    init_microservices_catalog()
    init_db_tools()
