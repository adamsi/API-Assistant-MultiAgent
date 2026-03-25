import requests

API_BASES_BY_ENTITY_TYPE = {
    "fruits": "https://www.fruityvice.com/api/fruit",
}

STUDENTS = [
    {"name": "Maya Cohen", "age": 21},
    {"name": "Noam Levi", "age": 24},
    {"name": "Daniel Katz", "age": 22},
    {"name": "Yael Mizrahi", "age": 23},
    {"name": "Omer Sharon", "age": 20},
]


def get_entity_by_name(name: str, entityType: str):
    print(f"get_entity_by_name(name={name}, entityType={entityType}) called.")

    # api_base = API_BASES_BY_ENTITY_TYPE.get(entityType)
    # if not api_base:
    #     raise ValueError(
    #         f"Unknown entityType '{entityType}'. "
    #         f"Expected one of: {list(API_BASES_BY_ENTITY_TYPE.keys())}"
    #     )
    #
    # response = requests.get(f"{api_base}/{name}")
    # response.raise_for_status()
    # return response.json()

    return STUDENTS
