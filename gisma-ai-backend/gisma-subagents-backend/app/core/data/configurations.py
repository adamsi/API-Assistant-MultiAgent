from dataclasses import dataclass

from app.settings import settings


@dataclass(frozen=True)
class TableField:
    service_name: str
    table_name: str
    field_name: str


api_entities_dict = {
    "students": {
        "graphql_url": "https://example.com/graphql",
        "entities": ["students", "vegetables"],
        "query": (
            'query {{ {entityType}(filter: {{ name: {{ equals: {{ value: "{name}" }} }} }}) }}'
        ),
    },
}


MICROSERVICES_CATALOG = {
    "students": {
        "db_url": settings.gisma_db_url,
        "schema": "gisma",
        "tables": ["students", "student_cards"],
        "aliases": [
            {"en": "enroll_year", "he": "שנת התחלה"},
        ],
        "relations": [],
    },
    "library": {
        "db_url": settings.gisma_db_url,
        "schema": "gisma",
        "tables": ["library_members", "book_loans"],
        "aliases": [],
        "relations": [],
    },
    "cafeteria": {
        "db_url": settings.gisma_db_url,
        "schema": "gisma",
        "tables": ["meal_wallets", "meal_orders"],
        "aliases": [
            {"en": "wallet balance", "he": "יתרת ארנק"},
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
