import asyncio
import functools
from asyncio import Future, Task
from logging import getLogger
from typing import Any, Dict, List, Optional, Union

from .errors import DAGError, encode_error
from .resolvers import resolve_args, resolve_property

logger = getLogger(__name__)

PIPELINE_TIMEOUT = 300


class Pipeline:
    functions = {}
    category = {}

    def __init__(self, spec: Dict[str, Any], timeout: float = PIPELINE_TIMEOUT):
        self._timeout = timeout
        self._spec = spec
        self._stages: Dict[str, Future] = self._gen_stages()
        self._input = self._gen_input()
        self._output = self._gen_output()
        self._parent_pipeline: Optional[Pipeline] = None

    async def _resolve_arg(self, stage: Any, path: str):
        parent_stage_name = path.split('.', 1)[0]
        subpath = path[len(parent_stage_name):].lstrip('.')

        if parent_stage_name == 'input':
            return await resolve_property(
                item=self._input,
                path=subpath,
            )

        if parent_stage_name not in self._stages:
            exc = DAGError(
                message=f'missing stage "{parent_stage_name}" in input param "{path}"',
                stage=stage.get('input', stage),
            )
            if self._parent_pipeline:
                try:
                    return await self._parent_pipeline._resolve_arg(stage=stage, path=path)
                except DAGError:
                    raise exc from None
            raise exc

        return await resolve_property(
            item=self._stages[parent_stage_name],
            path=subpath,
        )

    def _gen_stage(self, stage: Dict[str, Any]) -> asyncio.Task:
        func = self.functions[stage['func']]
        name = stage['name']
        if '.' in name:
            raise DAGError(
                message=f'invalid stage name: "{name}" ("." are forbidden)',
                stage=stage,
            )

        func = functools.partial(func, **stage.get('params', {}))
        kwargs = {
            kwarg: self._resolve_arg(stage=stage, path=path)
            for kwarg, path in stage.get('input', {}).items()
        }
        return asyncio.create_task(func(
            __stage=stage,
            __pipeline=self,
            **kwargs,
        ))

    def _gen_stages(self) -> Dict[str, Task]:
        stages = {}
        for stage in self._spec.get('stages', []):
            name = stage['name']
            if name in stages:
                raise DAGError(
                    message=f'duplicate name in call graph: {name}',
                    stage=stage,
                )
            stages[name] = self._gen_stage(stage)
        return stages

    def _gen_input(self) -> Dict[str, Future]:
        input = {}  # noqa
        if 'input' in self._spec:
            for name in self._spec['input']:
                input[name] = Future()
        return input

    def _gen_output(self) -> Union[Future, List[Future], Dict[str, Future]]:
        output = self._spec['output']
        if isinstance(output, str):
            return asyncio.create_task(self._resolve_arg(stage=self._spec, path=output))
        elif isinstance(output, (list, set, tuple)):
            return [
                asyncio.create_task(self._resolve_arg(stage=output, path=item))
                for item in output
            ]
        _output = {}
        for name, path in output.items():
            _output[name] = asyncio.create_task(self._resolve_arg(stage=output, path=path, ))
        return _output

    async def run(self, **kwargs) -> Dict[str, Any]:
        try:
            if len(self._input) != len(kwargs):
                raise DAGError(
                    message='incorrect input parameters amount',
                    stage=self._spec['input'],
                )

            for kwarg, future in self._input.items():
                future.set_result(kwargs[kwarg])

            return await asyncio.wait_for(
                resolve_args(self._output),
                timeout=self._timeout
            )
        except BaseException as e:
            raise DAGError(
                message=encode_error(self._spec, exc=e),
            ) from e
