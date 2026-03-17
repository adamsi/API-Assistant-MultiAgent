from dataclasses import dataclass
from app.settings import settings


@dataclass(frozen=True)
class TableField:
    service_name: str
    table_name: str
    field_name: str


MICROSERVICES_CATALOG = {
    "students": {
        "db_url": settings.gisma_db_url,
        "tables": ["students", "student_cards"],
        "aliases":
            [
                {"en": "enroll_year", "he": "שנת התחלה"},
                {"en": "student with name='adam sion'", "he": "סטודנט הזהב"},
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


def _init_microservice_relations():
    for service in MICROSERVICES_CATALOG.values():
        service["relations"].clear()

    for (left, right), relation in MICROSERVICES_RELATIONS.items():
        MICROSERVICES_CATALOG[left.service_name]["relations"].append(relation)
        MICROSERVICES_CATALOG[right.service_name]["relations"].append(relation)


_init_microservice_relations()
