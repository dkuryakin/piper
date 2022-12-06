import React, {memo, useCallback} from 'react';
import { Handle, useReactFlow, useStoreApi } from 'reactflow';
import './index.scss';
import { v4 as uuid4 } from 'uuid';
import {isValidConnection} from "../../utils/spec";


function AddInputButton({ nodeId }) {
    const { setNodes } = useReactFlow();
    const store = useStoreApi();

    const onAddInput = () => {
        const { nodeInternals } = store.getState();
        setNodes(
            Array.from(nodeInternals.values()).map((node) => {
                if (node.id === nodeId) {
                    node.data = {
                        ...node.data,
                        input: [
                            ...node.data.input,
                            {name: '', handleId: uuid4()},
                        ],
                    };
                }

                return node;
            })
        );
    };

    return (
        <button className={'nodrag add-input btn'} onClick={onAddInput}>+</button>
    );
}

function DelInputButton({ nodeId, handleId }) {
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
                        input: node.data.input.filter(({handleId}) => handleId !== hId),
                    };
                }

                return node;
            })
        );
    };

    return (
        <button className={'nodrag del-input btn'} onClick={onDelInput}>-</button>
    );
}

function Input({ value, handleId, nodeId }) {
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
                        input: node.data.input.map(({name, handleId}) => ({
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
        <div className="input">
            <div className={'input-body'}>
                <DelInputButton nodeId={nodeId} handleId={handleId} />
                <input className="nodrag" onChange={onChange} value={value} />
            </div>
            <Handle type="source" position="right" id={handleId} />
        </div>
    );
}

function InputNode({ id, data }) {
    const store = useStoreApi();

    return (
        <div className={'input-node'}>
            <div className="header">
                <div><strong>{data.label}</strong></div>
                <AddInputButton nodeId={id} />
            </div>
            <div className="body">
                {data.input.map(({name, handleId}) => (
                    <Input key={handleId} nodeId={id} value={name} handleId={handleId} />
                ))}
            </div>
            {data.type === 'map_input' ? (
                <div className={'map-input'}>
                    <Handle type="target" position="left" id={`${id}-map-input`} isValidConnection={(connection) => isValidConnection(connection, Array.from(store.getState().nodeInternals.values()))} />
                </div>
            ) : ''}
        </div>
    );
}

export default memo(InputNode);
