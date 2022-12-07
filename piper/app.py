from argparse import ArgumentParser
from importlib import import_module

import uvicorn
from fastapi import FastAPI

from . import functions  # noqa: register std blocks
from .specs import generate_specs

app = FastAPI()


@app.get("/specs.json")
def get_specs():
    return generate_specs()


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('--host', default='0.0.0.0')
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--include', action='append', default=[])
    args = parser.parse_args()

    for module in args.include:
        # import module for blocks registration
        import_module(module)

    uvicorn.run(app, host=args.host, port=args.port)
