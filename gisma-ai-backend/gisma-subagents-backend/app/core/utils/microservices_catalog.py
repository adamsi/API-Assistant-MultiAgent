from app.core.data.configurations import (
    MICROSERVICES_CATALOG,
    MICROSERVICES_RELATIONS,
)


SERVICES_DESCRIPTION = ""


def init_microservice_relations():
    for service in MICROSERVICES_CATALOG.values():
        service["relations"].clear()

    for (left, right), relation in MICROSERVICES_RELATIONS.items():
        MICROSERVICES_CATALOG[left.service_name]["relations"].append(relation)
        MICROSERVICES_CATALOG[right.service_name]["relations"].append(relation)


def build_services_description() -> str:
    lines = []
    for service_name, config in MICROSERVICES_CATALOG.items():
        tables = ", ".join(config["tables"])
        lines.append(f"- {service_name}: tables {tables}")
        aliases = config.get("aliases", [])
        if aliases:
            lines.append("  aliases:")
            for alias in aliases:
                lines.append(f"  - {alias['he']} -> {alias['en']}")

        relations = config.get("relations", [])
        if relations:
            lines.append("  relations:")
            for relation in relations:
                lines.append(f"  - {relation}")

    return "\n".join(lines)


def init_microservices_catalog():
    init_microservice_relations()
    global SERVICES_DESCRIPTION
    SERVICES_DESCRIPTION = build_services_description()


def get_services_context():
    return SERVICES_DESCRIPTION
