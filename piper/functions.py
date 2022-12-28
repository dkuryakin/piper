import re
from typing import Any, Dict, List, Tuple

from .decorators import register
from .pipeline import Pipeline


@register
async def map(  # noqa
        items: List[Any],
        __stage: Dict[str, Any],
        __pipeline: Pipeline,
        **_,
) -> List[Any]:
    results = []
    for item in items:
        pipeline = Pipeline(
            spec=__stage['params'],
            timeout=__pipeline._timeout,  # noqa
        )
        pipeline._parent_pipeline = __pipeline
        pipeline._input = item
        results.append(pipeline._output)  # noqa
    return results


@register
async def remap_regex(source: str, items: List[Tuple[str, str]], default: str) -> str:
    for regex, target in items:
        if re.fullmatch(regex, source):
            return target
    return default


@register
async def case_regex(  # noqa
        data: Any,
        source: str,
        items: List[Tuple[str, Dict[str, Any]]],
        default: Dict[str, Any],
        __pipeline: Pipeline,
) -> Any:
    for regex, subspec in items:
        if re.fullmatch(regex, source):
            spec = subspec
            break
    else:
        spec = default

    pipeline = Pipeline(
        spec=spec,
        timeout=__pipeline._timeout,  # noqa
    )
    pipeline._parent_pipeline = __pipeline
    pipeline._input = data
    return pipeline._output  # noqa
