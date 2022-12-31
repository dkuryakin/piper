from functools import partial, wraps
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple, Union

from typeguard import typechecked

from .errors import DAGError
from .pipeline import Pipeline
from .resolvers import resolve_args


@typechecked
def _register(
        func: Callable[..., Awaitable[Any]],
        category: Union[Tuple[str, ...], List[str]],
) -> Callable[..., Awaitable[Any]]:
    @wraps(func)
    async def _func(*args, __stage: Dict[str, Any] = None, __pipeline: Pipeline = None, **kwargs):
        # __stage is passed from outer context for proper error handling
        if args:
            raise DAGError(
                message=f'positional args are not supported for func "{func.__name__}"',
                stage=__stage,
            )
        try:
            kwargs = await resolve_args(kwargs)
            if '__pipeline' in func.__annotations__:  # noqa
                kwargs['__pipeline'] = __pipeline
            if '__stage' in func.__annotations__:  # noqa
                kwargs['__stage'] = __stage
            result = typechecked(func)(**kwargs)
            return await resolve_args(result)
        except BaseException as e:
            setattr(e, 'stage', getattr(e, 'stage', __stage))
            raise e

    Pipeline.functions[func.__name__] = _func
    Pipeline.category[func.__name__] = category
    return _func


def register(
        func: Optional[Callable[..., Awaitable[Any]]] = None,
        category: Optional[Union[Tuple[str, ...], List[str]]] = None,
) -> Callable[..., Awaitable[Any]]:
    if func is None:
        return partial(_register, category=category or ["default"])
    return _register(func)
