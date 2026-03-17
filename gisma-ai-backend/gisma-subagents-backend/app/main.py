from dotenv import load_dotenv

from app.core.graphs.generate_sql_graph import init_db_tools

load_dotenv()

from fastapi import FastAPI
from app.api.routers import agent_router

# will pass app object (web application) to uvicorn (the embedded server)
app = FastAPI()
app.include_router(agent_router.router)

@app.on_event("startup")
def init():
    init_db_tools()