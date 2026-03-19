from dataclasses import dataclass
from app.settings import settings


@dataclass(frozen=True)
class TableField:
    service_name: str
    table_name: str
    field_name: str


SERVICES_DESCRIPTION = ""
MICROSERVICES_CATALOG = {
    "students": {
        "db_url": settings.gisma_db_url,
        "tables": ["students", "student_cards"],
        "aliases":
            [
                {"en": "enroll_year", "he": "שנת התחלה"}
            ],
        "relations": [],
    },
    "library": {
        "db_url": settings.gisma_db_url,
        "tables": ["library_members", "book_loans"],
        "aliases": [],
        "relations": [],
    },
    "cafeteria": {
        "db_url": settings.gisma_db_url,
        "tables": ["meal_wallets", "meal_orders"],
        "aliases":
            [
                {"en": "wallet balance", "he": "יתרת ארנק"}
            ],
        "relations": [],
    },
}

MICROSERVICES_RELATIONS = {
    (
        TableField("students", "students", "email"),
        TableField("library", "library_members", "email"),
    ): "students.email <-> library_members.email",

    (
        TableField("students", "student_cards", "code"),
        TableField("cafeteria", "meal_wallets", "card_code"),
    ): "student_cards.code <-> meal_wallets.card_code",
}


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
