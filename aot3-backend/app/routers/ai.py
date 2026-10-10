import json
from typing import Any

from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.config import GEMINI_API_KEY, GEMINI_MODEL

router = APIRouter()


class TranslateWordRequest(BaseModel):
    word: str
    context_sentence: str
    target_language: str


class TranslateWordResponse(BaseModel):
    word: str
    translation: str
    part_of_speech: str
    definition_in_target_lang: str
    context_explanation: str


class SentenceBreakdownRequest(BaseModel):
    sentence: str
    target_language: str


class WordToken(BaseModel):
    word: str
    translation: str
    part_of_speech: str


class SentenceBreakdownResponse(BaseModel):
    original_sentence: str
    overall_translation: str
    word_by_word: list[WordToken] = Field(default_factory=list)


def _require_gemini_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured.",
        )
    return genai.Client(api_key=GEMINI_API_KEY)


def _parse_json_payload(raw: str) -> dict[str, Any]:
    text = (raw or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail="Gemini returned invalid JSON.",
        ) from exc
    if not isinstance(parsed, dict):
        raise HTTPException(
            status_code=502,
            detail="Gemini returned JSON that was not an object.",
        )
    return parsed


def _generate_structured_json(prompt: str, schema: type[BaseModel]) -> dict[str, Any]:
    client = _require_gemini_client()
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0.2,
            ),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API request failed: {exc}",
        ) from exc

    return _parse_json_payload(response.text or "")


@router.post("/translate-word", response_model=TranslateWordResponse)
def translate_word(payload: TranslateWordRequest):
    prompt = f"""You are a language-learning assistant.
Translate the given word into the target language using the surrounding sentence for context.

Return ONLY valid JSON with exactly these keys:
- word (string): the original word
- translation (string): the translation in the target language
- part_of_speech (string)
- definition_in_target_lang (string): a concise definition written in the target language
- context_explanation (string): how the word is used in this sentence, written in the target language

Word: {payload.word}
Context sentence: {payload.context_sentence}
Target language: {payload.target_language}
"""
    data = _generate_structured_json(prompt, TranslateWordResponse)
    try:
        return TranslateWordResponse.model_validate(data)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Gemini response did not match the translation schema.",
        ) from exc


@router.post("/sentence-breakdown", response_model=SentenceBreakdownResponse)
def sentence_breakdown(payload: SentenceBreakdownRequest):
    prompt = f"""You are a language-learning assistant.
Break the sentence into clickable word tokens for a learner.

Return ONLY valid JSON with exactly these keys:
- original_sentence (string): the input sentence
- overall_translation (string): a natural translation into the target language
- word_by_word (array of objects), each with:
  - word (string): the original token
  - translation (string): that token's meaning in the target language
  - part_of_speech (string)

Keep punctuation as separate tokens when it appears.

Sentence: {payload.sentence}
Target language: {payload.target_language}
"""
    data = _generate_structured_json(prompt, SentenceBreakdownResponse)
    data.setdefault("original_sentence", payload.sentence)
    try:
        return SentenceBreakdownResponse.model_validate(data)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Gemini response did not match the sentence-breakdown schema.",
        ) from exc
