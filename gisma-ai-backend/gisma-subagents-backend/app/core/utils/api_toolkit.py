import requests
from app.core.data.configurations import api_entities_dict


def get_api_entities_catalog():
    return [
        {
            "name": service_name,
            "entityTypes": service_config["entities"],
        }
        for service_name, service_config in api_entities_dict.items()
    ]



def gql_subselection(graphql_url: str, query_name: str) -> str:
    introspection_query = """
    query IntrospectionQuery {
      __schema {
        queryType {
          name
        }
        types {
          name
          fields {
            name
            type {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
    """
    response = requests.post(
        graphql_url,
        json={"query": introspection_query},
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()

    if payload.get("errors"):
        raise ValueError(f"GraphQL introspection failed: {payload['errors']}")

    schema = payload.get("data", {}).get("__schema", {})
    query_type_name = schema.get("queryType", {}).get("name")
    types_by_name = {
        item["name"]: item for item in schema.get("types", []) if item.get("name")
    }
    query_type = types_by_name.get(query_type_name or "")
    if not query_type:
        raise ValueError("GraphQL schema does not define a query root type.")

    query_field = next(
        (field for field in (query_type.get("fields") or []) if field["name"] == query_name),
        None,
    )
    if query_field is None:
        raise ValueError(f"Query '{query_name}' was not found.")

    root_type = query_field["type"]
    while root_type and root_type.get("ofType"):
        root_type = root_type["ofType"]
    root_type_name = root_type.get("name")
    if not root_type_name:
        return ""

    rendered_types: set[str] = set()
    pending: list[tuple[str, int, list[str], str | None, int]] = [(root_type_name, 0, [], None, 0)]
    completed: dict[tuple[str, int], list[str]] = {}

    while pending:
        type_name, depth, seen_list, parent_key, state = pending.pop()
        current_seen = set(seen_list)

        if state == 1:
            child_lines = completed.get((type_name, depth), [])
            if parent_key is not None:
                parent_type_name, parent_depth = parent_key.rsplit("@", 1)
                parent_depth_int = int(parent_depth)
                parent_lines = completed.setdefault((parent_type_name, parent_depth_int), [])
                field_name = child_lines[0]
                nested_lines = child_lines[1:]
                if nested_lines:
                    parent_lines.append(f'{"  " * parent_depth_int}{field_name} {{')
                    parent_lines.extend(nested_lines)
                    parent_lines.append(f'{"  " * parent_depth_int}}}')
                else:
                    parent_lines.append(f'{"  " * parent_depth_int}{field_name}')
            continue

        type_info = types_by_name.get(type_name) or {}
        fields = type_info.get("fields") or []
        completed[(type_name, depth)] = []
        if not fields or type_name in current_seen:
            continue

        pending.append((type_name, depth, seen_list, parent_key, 1))
        next_seen_list = list(current_seen | {type_name})

        for field in reversed(fields):
            field_name = field["name"]
            field_type = field["type"]
            while field_type and field_type.get("ofType"):
                field_type = field_type["ofType"]

            nested_type_name = field_type.get("name") if field_type else None
            nested_kind = field_type.get("kind") if field_type else None

            if nested_kind in {"SCALAR", "ENUM"} or not nested_type_name:
                completed[(type_name, depth)].append(f'{"  " * depth}{field_name}')
                continue

            completed[(nested_type_name, depth + 1)] = [field_name]
            pending.append(
                (
                    nested_type_name,
                    depth + 1,
                    next_seen_list,
                    f"{type_name}@{depth}",
                    0,
                )
            )

    return "\n".join(completed.get((root_type_name, 0), []))


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

    return []
