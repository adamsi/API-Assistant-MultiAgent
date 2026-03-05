from dotenv import load_dotenv

load_dotenv()

from fastmcp import FastMCP

from app.tools.get_api_fruits_graph import get_api_fruits_
from app.tools.generate_sql_graph import generate_sql_

mcp = FastMCP("gisma-mcp-server")


# @mcp.tool(description="Use this tool only when user_prompt asks specifically to use `get_api_fruits` tool")
# def get_api_fruits(user_request: str):
#     return get_api_fruits_(user_request)


@mcp.tool(description="get data from db according to user_request")
def get_gisma_data(user_request: str):
    return generate_sql_(user_request)


if __name__ == "__main__":
    mcp.run(transport="streamable-http", host="0.0.0.0", port=8081, path="/mcp")
