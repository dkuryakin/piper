import React, {ChangeEvent, FC, memo} from 'react';
import {Handle, Position, useReactFlow, useStoreApi} from 'reactflow';
import style from './FuncNode.module.css';
import {v4 as uuid4} from 'uuid';
import {isValidConnection, specToOptions, specToStr} from '../../../utils/spec';
import {IExtraOutput} from '../../../types';
import {max_type_length} from "../../../config";

interface AddOutputButtonProps {
    nodeId: string;
    spec: any;
}
const AddOutputButton: FC<AddOutputButtonProps> = ({nodeId, spec}) => {
    const options: any = specToOptions(spec);
    const val = Object.keys(options)[0];

    const {setNodes} = useReactFlow();
    const store = useStoreApi();

    const onAddOutput = () => {
        const {nodeInternals} = store.getState();
        setNodes(
            Array.from(nodeInternals.values()).map((node) => {
                if (node.id === nodeId) {
                    node.data = {
                        ...node.data,
                        extra_output: [
                            ...node.data.extra_output,
                            {name: val, handleId: uuid4(), spec: options[val]},
                        ],
                    };
                }

                return node;
            }),
        );
    };

    return (
        <button className={'nodrag add-output btn'} onClick={onAddOutput}
                disabled={Object.keys(options).length === 0}>+</button>
    );
}

interface DelOutputButtonProps {
    nodeId: string;
    handleId: string;
}
const DelOutputButton: FC<DelOutputButtonProps> = ({nodeId, handleId}) => {
    const {setNodes} = useReactFlow();
    const store = useStoreApi();
    const hId = handleId;

    const onDelInput = () => {
        const {nodeInternals} = store.getState();
        setNodes(
            Array.from(nodeInternals.values()).map((node) => {
                if (node.id === nodeId) {
                    node.data = {
                        ...node.data,
                        extra_output: node.data.extra_output.filter(({handleId}: IExtraOutput) => handleId !== hId),
                    };
                }

                return node;
            }),
        );
    };

    return (
        <button className={'nodrag del-output btn'} onClick={onDelInput}>-</button>
    );
}

interface InputParamProps {
    nodeId: string;
    handleId: string;
    spec: any;
    name: string;
}
const InputParam: FC<InputParamProps> = ({name, spec, handleId, nodeId}) => {
    const store = useStoreApi();

    return (
        <div className={style.inputParam}>
            <Handle className={style.inputHandle} type="target" position={Position.Left} id={handleId}
                    isValidConnection={(connection) => isValidConnection(connection, Array.from(store.getState().nodeInternals.values()))}/>
            <div className={style.inputParamBody}>
                {name}: {specToStr(spec, max_type_length)}
            </div>
        </div>
    );
}

interface OutputProps {
    spec: any;
    handleId: string;
    nodeId: string;
}
const Output: FC<OutputProps> = ({spec, handleId, nodeId}) => {
    const store = useStoreApi();

    return (
        <div className={style.output}>
            <AddOutputButton nodeId={nodeId} spec={spec}/>
            <div className={style.outputBody}>
                {specToStr(spec, max_type_length)}
            </div>
            <Handle className={style.outputHandle} type="source" position={Position.Right} id={handleId}
                    isValidConnection={(connection) => isValidConnection(connection, Array.from(store.getState().nodeInternals.values()))}/>
        </div>
    );
}

interface InputProps {
    nodeId: string;
    hId: string;
    index: number;
}
const Input: FC<InputProps> = ({nodeId, hId, index}) => {
    const store = useStoreApi();
    const {setNodes} = useReactFlow();
    const [value, setValue] = React.useState('0');

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        const correctValue = e.target.value === '' ? '0' : e.target.value;
        const {nodeInternals} = store.getState();
        setNodes(
            Array.from(nodeInternals.values()).map((node) => {
                if (node.id === nodeId) {
                    node.data = {
                        ...node.data,
                        extra_output: node.data.extra_output.map((output: IExtraOutput) => {
                            if (output.handleId === hId) {
                                output.indexes = {...output.indexes, [index]: correctValue};
                            }
                            return output;
                        }),
                    };
                }

                return node;
            }),
        );
        setValue(correctValue);
    };

    return (
        <input
            className="nodrag mt5"
            min="0"
            step="1"
            type={'number'}
            value={value}
            onChange={onChange}
        />
    );
};

interface ExtraOutputProps {
  value: string;
  spec: any;
  handleId: string;
  nodeId: string;
}
const ExtraOutput: FC<ExtraOutputProps> = ({value, spec, handleId, nodeId}) => {
    const options: any = specToOptions(spec);

    const {setNodes} = useReactFlow();
    const store = useStoreApi();
    const hId = handleId;

    const onChange = (evt: ChangeEvent<HTMLSelectElement>) => {
        const {nodeInternals} = store.getState();
        const _nodes = Array.from(nodeInternals.values()).map((node) => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        extra_output: node.data.extra_output.map(({name, handleId}: IExtraOutput) => ({
                            name: hId === handleId ? evt.target.value : name,
                            handleId,
                            spec: options[hId === handleId ? evt.target.value : name],
                        })),
                    },
                };
            }

            return node;
        });
        setNodes(_nodes);
    };

    if (Object.keys(options).length === 0) {
        return <></>;
    }

    return (
        <div className={style.extraOutput}>
            <div className={style.extraOutputBody}>
                <DelOutputButton nodeId={nodeId} handleId={handleId}/>
                <div className={style.options}>
                    <select className="nodrag" onChange={onChange} value={value}>
                        {Object.keys(options).map(option => (
                            <option value={option} key={option}>{option}</option>
                        ))}
                    </select>
                    {Array.from(value.matchAll(/\[([^\]]+)]/g)).map((param, i) => {
                        const type = param[1];  // i, key, ...
                        if (type === 'i') {
                            return (
                                <Input key={i} index={i} nodeId={nodeId} hId={hId}/>
                            );
                        }
                        return '';
                    })}
                </div>
            </div>
            <Handle className={style.handle} type="source" position={Position.Right} id={handleId}
                    isValidConnection={(connection) => isValidConnection(connection, Array.from(store.getState().nodeInternals.values()))}/>
        </div>
    );
}

interface FuncNodeProps {
    id: string;
    data: any
}
export const FuncNode: FC<FuncNodeProps> = memo(({id, data}) => {
    return (
        <div className={style.funcNode}>
            <div className={style.header}>
                <div><strong>{data.label}</strong></div>
            </div>
            <div className={style.body}>
                {Object.keys(data.input).map(param_name => (
                    <InputParam
                        key={param_name}
                        nodeId={id}
                        name={param_name}
                        spec={data.input[param_name]}
                        handleId={`func-node-${id}-input.${param_name}`}
                    />
                ))}
            </div>
            <Output
                nodeId={id}
                spec={data.output}
                handleId={`func-node-${id}-output`}
            />
            {data.extra_output.map(({name, handleId}: IExtraOutput) => (
                <ExtraOutput key={handleId} nodeId={id} value={name} spec={data.output} handleId={handleId}/>
            ))}
        </div>
    );
});
