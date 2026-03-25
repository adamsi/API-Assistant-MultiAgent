import requests

api_entities_dict = {
    "students": {
        "graphql_url": "https://example.com/graphql",
        "entities": ["students", "vegetables"],
        "query": (
            'query {{ {entityType}(filter: {{ name: {{ equals: {{ value: "{name}" }} }} }}) }}'
        ),
    },
}


def get_api_entities_catalog():
    return [
        {
            "name": service_name,
            "entityTypes": service_config["entities"],
        }
        for service_name, service_config in api_entities_dict.items()
    ]

STUDENTS = [
    {"name": "Maya Cohen", "age": 21},
    {"name": "Noam Levi", "age": 24},
    {"name": "Daniel Katz", "age": 22},
    {"name": "Yael Mizrahi", "age": 23},
    {"name": "Omer Sharon", "age": 20},
]


def get_entity_by_name(name: str, entityType: str, service: str):
    print(
        f"get_entity_by_name(name={name}, entityType={entityType}, service={service}) called."
    )

    # service_config = api_entities_dict.get(service)
    # if not service_config:
    #     raise ValueError(
    #         f"Unknown service '{service}'. "
    #         f"Expected one of: {list(api_entities_dict.keys())}"
    #     )
    #
    # if entityType not in service_config["entities"]:
    #     raise ValueError(
    #         f"Unknown entityType '{entityType}' for service '{service}'. "
    #         f"Expected one of: {service_config['entities']}"
    #     )
    #
    # query = service_config["query"].format(entityType=entityType, name=name)
    # response = requests.post(
    #     service_config["graphql_url"],
    #     json={"query": query},
    # )
    # response.raise_for_status()
    # return response.json()

    return STUDENTS
