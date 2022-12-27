import json
from typing import Any


class DAGError(RuntimeError):
    def __init__(self, message: str = None, stage: Any = None):
        self.stage = stage
        super().__init__(message)


def format_error_block(text: str, error: str) -> str:
    if not error:
        return text
    lines = text.splitlines(keepends=False)
    max_length = max(len(line) for line in lines)
    lines = [
        line + ' ' * (max_length - len(line) + 1) + '|'
        for line in lines
    ]
    lines[0] += f' <---[ERROR HERE]---[{error}]'
    return '\n'.join(lines)


def encode_error(obj: Any, indent: int = 4, depth: int = 0, exc: BaseException = None):
    stage = getattr(exc, 'stage', None)
    prefix0 = ' ' * depth * indent
    prefix1 = ' ' * (depth + 1) * indent

    if obj is None or isinstance(obj, (bool, int, float, str)):
        return prefix0 + json.dumps(obj)

    if exc and stage and obj == stage:
        error = str(exc) or str(exc.__cause__)
    else:
        error = None

    if isinstance(obj, (list, tuple, set)):
        body = [
            encode_error(
                i, indent=indent, depth=depth + 1, exc=exc,
            )
            for i in obj
        ]
        _body = []
        for b in body:
            if b.endswith(' |'):
                _b = b.rstrip(' |')
                b = _b + ',' + ' ' * (len(b) - len(_b) - 3) + ' |\n'
            else:
                b += ',\n'
            _body.append(b)
        body = ''.join(_body).strip(',\n')
        if body.strip():
            body = body + '\n'
        return format_error_block(
            text=f'{prefix0}[\n' + body + f'{prefix0}]',
            error=error,
        )
    if isinstance(obj, dict):
        body = ''.join(
            prefix1 + json.dumps(k) + ': ' + encode_error(
                v, indent=indent, depth=depth + 1, exc=exc,
            ).lstrip()
            + ',\n'
            for k, v in obj.items()
        ).strip(',\n')
        if body.strip():
            body = body + '\n'
        return format_error_block(
            text=f'{prefix0}{{\n' + body + f'{prefix0}}}',
            error=error,
        )
    else:
        raise TypeError(f'unknown type: {type(obj)}')
