
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
import httpx
import trafilatura
from bs4 import BeautifulSoup
import re

router = APIRouter()


def clean_article_text(text: str) -> str:
    """Remove common standalone photo credits and webpage clutter."""

    unwanted_patterns = [
        r"^Getty Images$",
        r"^Image source:\s*.+$",
        r"^Photo by\s+.+$",
        r"^Photograph by\s+.+$",
        r"^Image credit:\s*.+$",
        r"^Photo credit:\s*.+$",
        r"^Credit:\s*.+$",
        r"^Advertisement$",
        r"^Advertisment$",
    ]

    cleaned_lines = []

    for line in text.splitlines():
        line = line.strip()

        if not line:
            cleaned_lines.append("")
            continue

        # Skip lines matching known photo credits or clutter.
        if any(
            re.match(pattern, line, flags=re.IGNORECASE)
            for pattern in unwanted_patterns
        ):
            continue

        cleaned_lines.append(line)

    # Remove excessive blank lines.
    cleaned_text = "\n".join(cleaned_lines)
    cleaned_text = re.sub(r"\n{3,}", "\n\n", cleaned_text)

    return cleaned_text.strip()


class ArticleRequest(BaseModel):
    url: HttpUrl


@router.post("/extract-article")
async def extract_article(request: ArticleRequest):
    url = str(request.url)

    # Retrieve the webpage.
    try:
        async with httpx.AsyncClient(
            timeout=15.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 AoT3Reader/1.0"},
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

    except httpx.HTTPError:
        raise HTTPException(
            status_code=502,
            detail=(
                "Could not retrieve this article. "
                "Check the URL or try another website."
            ),
        )

    # Make sure the response is an HTML webpage.
    content_type = response.headers.get("content-type", "")

    if "text/html" not in content_type.lower():
        raise HTTPException(
            status_code=400,
            detail="This URL did not return an HTML article page.",
        )

    downloaded_html = response.text

    # Extract the article text.
    text = trafilatura.extract(
        downloaded_html,
        include_comments=False,
        include_tables=False,
    )

    # Extract the webpage title.
    soup = BeautifulSoup(downloaded_html, "html.parser")
    title = ""

    if soup.title:
        title = soup.title.get_text(" ", strip=True)

    # If Trafilatura cannot find enough text, try BeautifulSoup.
    if not text or len(text.strip()) < 50:
        article = (
            soup.find("article")
            or soup.find("main")
            or soup.body
        )

        if article:
            # Remove elements that aren't useful article content.
            for element in article(
                ["script", "style", "nav", "footer", "aside", "form"]
            ):
                element.decompose()

            paragraphs = [
                element.get_text(" ", strip=True)
                for element in article.find_all(
                    ["p", "h1", "h2", "h3"]
                )
            ]

            text = "\n\n".join(
                paragraph
                for paragraph in paragraphs
                if paragraph
            )

    # Remove common photo credits and clutter.
    if text:
        text = clean_article_text(text)

    # Return a helpful error if extraction still fails.
    if not text or len(text.strip()) < 50:
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not extract enough article text. "
                "This website may require JavaScript or block "
                "automated access. Try another article or upload "
                "a PDF/TXT copy."
            ),
        )

    # Send the cleaned article to the frontend.
    return {
        "title": title or "Extracted Article",
        "url": str(response.url),
        "text": text.strip(),
    }
