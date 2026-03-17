from app.settings import settings

MICROSERVICES_CATALOG = {
    "students": {
        "db_url": settings.gisma_db_url,
        "tables": [
            "students",
            "student_cards"
        ]
    },
    "library": {
        "db_url": settings.gisma_db_url,
        "tables": [
            "library_members",
            "book_loans"
        ]
    },
    "cafeteria": {
        "db_url": settings.gisma_db_url,
        "tables": [
            "meal_wallets",
            "meal_orders"
        ]
    }
}