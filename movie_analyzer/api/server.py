"""Entry point: python -m movie_analyzer.api.server"""
import uvicorn


def main():
    uvicorn.run(
        "movie_analyzer.api.app:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1,
    )


if __name__ == "__main__":
    main()
