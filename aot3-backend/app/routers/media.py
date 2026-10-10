from io import BytesIO
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from fastapi import APIRouter, File, HTTPException, UploadFile
from pypdf import PdfReader
from pydantic import BaseModel, HttpUrl

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".txt"}
BOILERPLATE_TAGS = [
    "script",
    "style",
    "noscript",
    "nav",
    "footer",
    "header",
    "aside",
    "form",
    "iframe",
]


class ParseUrlRequest(BaseModel):
    url: HttpUrl


def _extract_pdf_text(raw: bytes) -> str:
    reader = PdfReader(BytesIO(raw))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages).strip()


def _extract_txt_text(raw: bytes) -> str:
    try:
        return raw.decode("utf-8").strip()
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="TXT file must be valid UTF-8.",
        ) from exc


def _scrape_article_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(BOILERPLATE_TAGS):
        tag.decompose()

    container = soup.find("article") or soup.body or soup
    paragraphs = [
        " ".join(p.get_text(" ", strip=True).split())
        for p in container.find_all("p")
        if p.get_text(strip=True)
    ]
    text = "\n\n".join(paragraphs).strip()
    if text:
        return text

    fallback = " ".join(container.get_text(" ", strip=True).split())
    return fallback


@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="A filename is required.")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and TXT files are supported.",
        )

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        if suffix == ".pdf":
            extracted_text = _extract_pdf_text(raw)
            file_type = "pdf"
        else:
            extracted_text = _extract_txt_text(raw)
            file_type = "txt"
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse uploaded file: {exc}",
        ) from exc

    return {
        "filename": file.filename,
        "file_type": file_type,
        "character_count": len(extracted_text),
        "extracted_text": extracted_text,
    }


@router.post("/parse-url")
def parse_url(payload: ParseUrlRequest):
    url = str(payload.url)
    try:
        response = requests.get(
            url,
            timeout=15,
            headers={"User-Agent": "AthenaeumOfTongues/1.0"},
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch URL: {exc}",
        ) from exc

    extracted_text = _scrape_article_text(response.text)
    if not extracted_text:
        raise HTTPException(
            status_code=422,
            detail="No article text could be extracted from the URL.",
        )

    return {"url": url, "extracted_text": extracted_text}
