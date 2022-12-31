import re
from typing import Any, Dict, List, Tuple, Union

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
async def remap_regex(value: str, items: List[Union[Tuple[str, str], List[str]]], default: str) -> str:
    for regex, target in items:
        if re.fullmatch(regex, value):
            return target
    return default


@register
async def case_regex(  # noqa
        data: Any,
        value: str,
        items: List[Tuple[str, Dict[str, Any]]],
        default: Dict[str, Any],
        __pipeline: Pipeline,
) -> Any:
    for regex, subspec in items:
        if re.fullmatch(regex, value):
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
