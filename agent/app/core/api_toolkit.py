import requests
from langchain_core.tools import tool

API_BASE = "https://www.fruityvice.com/api/fruit"

@tool(description= "Get fruit by name from API")
def get_fruit_by_name(name:str):
    response = requests.get(f"{API_BASE}/{name}")
    response.raise_for_status()
    return response.json()

@tool(description= "Get All fruits from API")
def get_all_fruits():
    response = requests.get(f"{API_BASE}/all")
    response.raise_for_status()
    return response.json()

api_toolkit = [get_fruit_by_name, get_all_fruits]