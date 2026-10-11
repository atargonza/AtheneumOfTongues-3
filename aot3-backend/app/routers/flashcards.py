
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import WordTranslation, get_db

router = APIRouter()


class FlashcardItem(BaseModel):
    id: int
    original_word: str
    translated_word: str

    class Config:
        from_attributes = True


class FlashcardListResponse(BaseModel):
    flashcards: list[FlashcardItem]


class SaveWordRequest(BaseModel):
    original_word: str
    translated_word: str


@router.get("/flashcards", response_model=FlashcardListResponse)
def get_flashcards(db: Session = Depends(get_db)):
    words = db.query(WordTranslation).all()

    flashcards = [
        FlashcardItem(
            id=word.id,
            original_word=word.original_word,
            translated_word=word.translated_word,
        )
        for word in words
    ]

    return FlashcardListResponse(flashcards=flashcards)


@router.post("/save")
def save_word(
    payload: SaveWordRequest,
    db: Session = Depends(get_db),
):
    original_word = payload.original_word.strip()
    translated_word = payload.translated_word.strip()

    if not original_word or not translated_word:
        raise HTTPException(
            status_code=400,
            detail="Both the original word and translation are required.",
        )

    word = WordTranslation(
        original_word=original_word,
        translated_word=translated_word,
    )

    db.add(word)
    db.commit()
    db.refresh(word)

    return {
        "message": "Word saved successfully.",
        "id": word.id,
        "original_word": word.original_word,
        "translated_word": word.translated_word,
    }
