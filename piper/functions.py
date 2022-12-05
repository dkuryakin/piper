from typing import Any, Dict, List

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
