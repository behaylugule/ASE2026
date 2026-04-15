import logging

from django.conf import settings
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)


def generate_with_context(
    *,
    context: str,
    query: str,
    chat_history: list[dict],
) -> str:
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured")

    from apps.rag.prompts import SYSTEM_PROMPT

    llm = ChatOpenAI(
        model=settings.OPENAI_CHAT_MODEL,
        temperature=0,
        api_key=settings.OPENAI_API_KEY,
    )
    system = SYSTEM_PROMPT.format(context=context)
    messages: list = [SystemMessage(content=system)]
    for turn in chat_history:
        role = turn.get("role")
        content = turn.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))
    messages.append(HumanMessage(content=query))
    result = llm.invoke(messages)
    return result.content
