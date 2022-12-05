import React, { memo } from 'react';
import { Handle, useReactFlow, useStoreApi } from 'reactflow';
import './index.scss';
import { v4 as uuid4 } from 'uuid';



function AddOutputButton({ nodeId }) {
    const { setNodes } = useReactFlow();
    const store = useStoreApi();

    const onAddOutput = () => {
        const { nodeInternals } = store.getState();
        setNodes(
            Array.from(nodeInternals.values()).map((node) => {
                if (node.id === nodeId) {
                    node.data = {
                        ...node.data,
                        output: [
                            ...node.data.output,
                            {name: '', handleId: uuid4()},
                        ],
                    };
                }

                return node;
            })
        );
    };

    return (
        <button className={'nodrag add-output btn'} onClick={onAddOutput}>+</button>
    );
}

function DelOutputButton({ nodeId, handleId }) {
    const { setNodes } = useReactFlow();
    const store = useStoreApi();
    const hId = handleId;

    const onDelOutput = () => {
        const { nodeInternals } = store.getState();
        setNodes(
            Array.from(nodeInternals.values()).map((node) => {
                if (node.id === nodeId) {
                    node.data = {
                        ...node.data,
                        output: node.data.output.filter(({handleId}) => handleId !== hId),
                    };
                }

                return node;
            })
        );
    };

    return (
        <button className={'nodrag del-output btn'} onClick={onDelOutput}>-</button>
    );
}

function Output({ value, handleId, nodeId }) {
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
                        output: node.data.output.map(({name, handleId}) => ({
                            name: hId === handleId ? evt.target.value : name,
                            handleId,
                        })),
                    };
                }

                return node;
            })
        );
    };

    return (
        <div className="output">
            <Handle type="target" position="left" id={handleId} />
            <div className={'output-body'}>
                <DelOutputButton nodeId={nodeId} handleId={handleId} />
                <input className="nodrag" onChange={onChange} value={value} />
            </div>
        </div>
    );
}

function OutputNode({ id, data }) {
    return (
        <div className={'output-node'}>
            <div className="header">
                <div><strong>{data.label}</strong></div>
                <AddOutputButton nodeId={id} />
            </div>
            <div className="body">
                {data.output.map(({name, handleId}) => (
                    <Output key={handleId} nodeId={id} value={name} handleId={handleId} />
                ))}
            </div>
            {data.type === 'map_output' ? (
                <Handle type="source" position="right" id={`${id}-map-output`} />
            ) : ''}
        </div>
    );
}

export default memo(OutputNode);
