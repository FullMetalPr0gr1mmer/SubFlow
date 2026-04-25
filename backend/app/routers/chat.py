from fastapi import APIRouter, Depends

from app.dependencies import CurrentUser, get_current_user
from app.models.schemas import ChatRequest, ChatResponse
from app.services.chat_service import generate_reply

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
):
    history = [msg.model_dump() for msg in body.conversation_history]
    reply = await generate_reply(user.id, body.message, history)
    return ChatResponse(reply=reply)
