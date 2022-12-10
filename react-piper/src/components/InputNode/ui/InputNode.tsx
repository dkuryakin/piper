import React, {ChangeEvent, FC, memo} from 'react';
import {Handle, Position, useReactFlow, useStoreApi} from 'reactflow';
import style from './InputNode.module.css';
import {v4 as uuid4} from 'uuid';
import {isValidConnection} from '../../../utils/spec';
import {IOutputInput} from '../../../types';

interface AddInputButtonProps {
    nodeId: string;
}

const AddInputButton: FC<AddInputButtonProps> = ({nodeId}) => {
    const {setNodes} = useReactFlow();
    const store = useStoreApi();

    const onAddInput = () => {
        const {nodeInternals} = store.getState();
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
            }),
        );
    };

    return (
        <button className={'nodrag add-input btn'} onClick={onAddInput}>+</button>
    );
};

interface DelInputButtonProps {
    nodeId: string;
    handleId: string;
}

const DelInputButton: FC<DelInputButtonProps> = ({nodeId, handleId}) => {
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
                        input: node.data.input.filter(({handleId}: IOutputInput) => handleId !== hId),
                    };
                }

                return node;
            }),
        );
    };

    return (
        <button className={'nodrag del-input btn'} onClick={onDelInput}>-</button>
    );
};

interface InputProps {
    nodeId: string;
    handleId: string;
    value: string;
}

const Input: FC<InputProps> = ({value, handleId, nodeId}) => {
    const {setNodes} = useReactFlow();
    const store = useStoreApi();
    const hId = handleId;

    const onChange = (evt: ChangeEvent<HTMLInputElement>) => {
        const {nodeInternals} = store.getState();
        setNodes(
            Array.from(nodeInternals.values()).map((node) => {
                if (node.id === nodeId) {
                    node.data = {
                        ...node.data,
                        input: node.data.input.map(({name, handleId}: IOutputInput) => ({
                            name: hId === handleId ? evt.target.value : name,
                            handleId,
                        })),
                    };
                }

                return node;
            }),
        );
    };

    return (
        <div className={style.input}>
            <div className={style.inputBody}>
                <DelInputButton nodeId={nodeId} handleId={handleId}/>
                <input className="nodrag" onChange={onChange} value={value}/>
            </div>
            <Handle className={style.handle} type="source" position={Position.Right} id={handleId}/>
        </div>
    );
};

interface InputNodeProps {
    data: any;
    id: string;
}

export const InputNode: FC<InputNodeProps> = memo(({id, data}) => {
    const store = useStoreApi();

    return (
        <div>
            <div className={style.header}>
                <div><strong>{data.label}</strong></div>
                <AddInputButton nodeId={id}/>
            </div>
            <div className={style.body}>
                {data.input.map(({name, handleId}: IOutputInput) => (
                    <Input key={handleId} nodeId={id} value={name} handleId={handleId}/>
                ))}
            </div>
            {data.type === 'map_input' && (
                <Handle className={style.mapHandle} type="target" position={Position.Left} id={`${id}-map-input`}
                        isValidConnection={(connection) => isValidConnection(connection, Array.from(store.getState().nodeInternals.values()))}/>
            )}
        </div>
    );
});