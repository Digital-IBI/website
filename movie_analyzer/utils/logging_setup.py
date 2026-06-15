from __future__ import annotations
import logging
from rich.logging import RichHandler
from rich.console import Console

console = Console()


def setup_logging(level: str = "INFO") -> logging.Logger:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(message)s",
        datefmt="[%X]",
        handlers=[RichHandler(console=console, rich_tracebacks=True)],
    )
    logger = logging.getLogger("movie_analyzer")
    return logger


logger = setup_logging()
