import React, { memo } from 'react';
import { Handle, useReactFlow, useStoreApi } from 'reactflow';
import './index.scss';
import { v4 as uuid4 } from 'uuid';
import {specToOptions, specToStr} from "../../utils/spec";


function AddOutputButton({ nodeId, spec }) {
    const options = specToOptions(spec);

    const { setNodes } = useReactFlow();
    const store = useStoreApi();

    const onAddOutput = () => {
        const { nodeInternals } = store.getState();
        setNodes(
            Array.from(nodeInternals.values()).map((node) => {
                if (node.id === nodeId) {
                    node.data = {
                        ...node.data,
                        extra_output: [
                            ...node.data.extra_output,
                            {name: '', handleId: uuid4()},
                        ],
                    };
                }

                return node;
            })
        );
    };

    return (
        <button className={'nodrag add-output btn'} onClick={onAddOutput} disabled={options.length === 0}>+</button>
    );
}

function DelOutputButton({ nodeId, handleId }) {
    const { setNodes } = useReactFlow();
    const store = useStoreApi();
    const hId = handleId;

    const onDelInput = () => {
        const { nodeInternals } = store.getState();
        setNodes(
            Array.from(nodeInternals.values()).map((node) => {
                if (node.id === nodeId) {
                    node.data = {
                        ...node.data,
                        extra_output: node.data.extra_output.filter(({handleId}) => handleId !== hId),
                    };
                }

                return node;
            })
        );
    };

    return (
        <button className={'nodrag del-output btn'} onClick={onDelInput}>-</button>
    );
}



function InputParam({ name, spec, handleId, nodeId }) {
    const { setNodes } = useReactFlow();
    const store = useStoreApi();
    const hId = handleId;

    return (
        <div className="input-param">
            <Handle type="target" position="left" id={handleId} />
            <div className={'input-param-body'}>
                {name}: {specToStr(spec)}
            </div>
        </div>
    );
}

function Output({ spec, handleId, nodeId }) {
    const { setNodes } = useReactFlow();
    const store = useStoreApi();
    const hId = handleId;

    return (
        <div className="output">
            <AddOutputButton nodeId={nodeId} spec={spec}/>
            <div className={'output-body'}>
                {specToStr(spec)}
            </div>
            <Handle type="source" position="right" id={handleId} />
        </div>
    );
}


function ExtraOutput({ value, spec, handleId, nodeId }) {
    const options = specToOptions(spec);
    const val = value || options[0];

    const { setNodes } = useReactFlow();
    const store = useStoreApi();
    const hId = handleId;

    const onChange = (evt) => {
        const { nodeInternals } = store.getState();
        setNodes(
            Array.from(nodeInternals.values()).map((node) => {
                if (node.id === nodeId) {
                    node.data = {
                        ...node.data,
                        extra_output: node.data.extra_output.map(({name, handleId}) => ({
                            name: hId === handleId ? evt.target.value : name,
                            handleId,
                        })),
                    };
                }

                return node;
            })
        );
    };

    if (options.length === 0) {
        return '';
    }

    return (
        <div className="extra-output">
            <div className={'extra-output-body'}>
                <DelOutputButton nodeId={nodeId} handleId={handleId} />
                <div className={'options'}>
                    <select className="nodrag" onChange={onChange} value={val}>
                        {options.map(option => (
                            <option value={option} key={option}>{option}</option>
                        ))}
                    </select>
                    {[...val.matchAll(/\[([^\]]+)]/g)].map((param, i) => {
                        const type = param[1];  // i, key, ...
                        if (type === 'i') {
                            return (
                                <input key={i} className="nodrag mt5" min="0" step="1" type={'number'}/>
                            );
                        }
                    })}
                </div>
            </div>
            <Handle type="source" position="right" id={handleId} />
        </div>
    );
}



function FuncNode({ id, data }) {
    return (
        <div className={'func-node'}>
            <div className="header">
                <div><strong>{data.label}</strong></div>
            </div>
            <div className="body">
                {Object.keys(data.input).map(param_name => (
                    <InputParam
                        key={param_name}
                        nodeId={id}
                        name={param_name}
                        spec={data.input[param_name]}
                        handleId={`func-node-${id}-input-${param_name}`}
                    />
                ))}
            </div>
            <Output
                nodeId={id}
                spec={data.output}
                id={`func-node-${id}-output`}
            />
            {data.extra_output.map(({name, handleId}) => (
                <ExtraOutput key={handleId} nodeId={id} value={name} spec={data.output} handleId={handleId} />
            ))}
        </div>
    );
}

export default memo(FuncNode);
