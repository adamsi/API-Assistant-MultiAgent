import requests

API_BASES_BY_ENTITY_TYPE = {
    "fruits": "https://www.fruityvice.com/api/fruit",
}


def get_entity_by_name(name: str, entityType: str):
    print(f"get_entity_by_name(name={name}, entityType={entityType}) called.")

    api_base = API_BASES_BY_ENTITY_TYPE.get(entityType)
    if not api_base:
        raise ValueError(
            f"Unknown entityType '{entityType}'. "
            f"Expected one of: {list(API_BASES_BY_ENTITY_TYPE.keys())}"
        )

    response = requests.get(f"{api_base}/{name}")
    response.raise_for_status()
    return response.json()
