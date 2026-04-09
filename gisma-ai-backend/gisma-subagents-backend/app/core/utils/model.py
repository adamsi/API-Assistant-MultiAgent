from langchain.chat_models import init_chat_model
from app.settings import settings

model_kwargs = {
    "model": settings.llm_model,
    "model_provider": "openai",
    "api_key": settings.openai_api_key,
}

if settings.openai_base_url:
    model_kwargs["base_url"] = settings.openai_base_url

model = init_chat_model(**model_kwargs)
