from inspect import isawaitable
from typing import Any, List, Union


async def resolve_args(args: Any) -> Any:
    """Resolve awaitable nested args"""
    if isawaitable(args):
        args = await args
    if isinstance(args, (list, set)):
        return [
            await resolve_args(arg)
            for arg in args
        ]
    if isinstance(args, tuple):
        return (
            await resolve_args(arg)
            for arg in args
        )
    if isinstance(args, dict):
        return {
            key: await resolve_args(val)
            for key, val in args.items()
        }
    return args


async def resolve_property(item: Any, path: Union[str, List[str]]) -> Any:
    if isawaitable(item):
        return await resolve_property(item=await item, path=path)

    if not path:
        return item

    if isinstance(path, str):
        keys = path.split('.')
    else:
        keys = path

    key = keys.pop(0)
    if key.isdigit():
        key = int(key)
        return await resolve_property(item=item[key], path=keys)
    if hasattr(item, key):
        return await resolve_property(item=getattr(item, key), path=keys)
    return await resolve_property(item=item[key], path=keys)
