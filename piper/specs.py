from dataclasses import is_dataclass
from inspect import isclass
from typing import Any, Dict, get_args, get_origin, List, Union

import numpy as np

from .pipeline import Pipeline

INTERNAL_FUNCTIONS = (
    'map',
    'remap_regex',
    'case_regex',
)


def type_to_spec(t: type) -> Any:
    # scalar types
    if t is str:
        return {'type': 'string'}
    if isclass(t) and issubclass(t, bytes):
        return {'type': 'bytes'}
    if t is int:
        return {'type': 'integer'}
    if t is float:
        return {'type': 'float'}
    if t is bool:
        return {'type': 'boolean'}
    if isclass(t) and issubclass(t, np.ndarray):
        return {'type': 'tensor'}
    if t is Any:
        return {'type': 'any'}
    if t is type(None):
        return {'type': 'none'}

    # composite types
    if get_origin(t) is dict:
        args = get_args(t)
        return {
            'type': 'dict',
            'key_type': type_to_spec(args[0]),
            'value_type': type_to_spec(args[1]),
        }
    if get_origin(t) is list:
        return {
            'type': 'array',
            'value_type': type_to_spec(get_args(t)[0]),
        }
    if get_origin(t) is tuple:
        return {'type': 'tuple', 'value_type': [
            type_to_spec(subtype)
            for subtype in get_args(t)
        ]}
    if get_origin(t) is Union:
        return {'type': 'union', 'value_type': [
            type_to_spec(subtype)
            for subtype in get_args(t)
        ]}
    if is_dataclass(t):
        return {'type': 'object', 'value_type': {
            key: type_to_spec(subtype)
            for key, subtype in t.__annotations__.items()
        }}
    raise TypeError(f'unserializeble type: {t}')


def generate_specs(exclude_funcs: List[str] = INTERNAL_FUNCTIONS) -> List[Dict[str, Any]]:
    specs = []
    for func in Pipeline.functions:
        if func in exclude_funcs:
            continue

        doc = Pipeline.functions[func].__doc__
        annotations = Pipeline.functions[func].__annotations__
        category = Pipeline.category[func]
        output_type = annotations.pop('return')
        output_spec = type_to_spec(output_type)

        input_spec = {}
        for input_name, input_type in annotations.items():
            input_param_spec = type_to_spec(input_type)
            input_spec[input_name] = input_param_spec

        spec = {
            'func': func,
            'input': input_spec,
            'output': output_spec,
            'description': doc,
            'category': category,
        }
        specs.append(spec)
    return specs
