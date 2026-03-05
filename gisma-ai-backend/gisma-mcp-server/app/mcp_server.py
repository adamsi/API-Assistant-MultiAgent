from dotenv import load_dotenv
load_dotenv()

from fastmcp import FastMCP

from app.tools.get_api_fruits_graph import get_api_fruits_
from app.tools.generate_sql_graph import generate_sql_

mcp = FastMCP("gisma-mcp-server")

@mcp.tool
def get_api_fruits(user_request: str):
    """get fruits from api by user_request filter"""
    return get_api_fruits_(user_request)

@mcp.tool
def generate_sql(user_request: str):
    """get data from db according to user_request"""
    return generate_sql_(user_request)

if __name__ == "__main__":
    mcp.run(transport="sse")