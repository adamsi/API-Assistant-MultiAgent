from langchain.chat_models import init_chat_model
from app.settings import settings

# LLM Model
model = init_chat_model(settings.llm_model)