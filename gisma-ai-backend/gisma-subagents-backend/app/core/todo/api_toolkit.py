import requests

API_BASE = "https://www.fruityvice.com/api/fruit"

def get_entity_by_name(name:str):
    print(f"get_fruit_by_name({name}) called.")
    response = requests.get(f"{API_BASE}/{name}")
    response.raise_for_status()
    return response.json()