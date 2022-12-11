import React, {ChangeEvent, FC} from 'react';
import {Handle, Position, useReactFlow, useStoreApi} from 'reactflow';
import style from './OutputNode.module.css';
import { v4 as uuid4 } from 'uuid';
import {IOutputInput} from '../../../types';

interface AddOutputButtonProps {
    nodeId: string;
}
const AddOutputButton: FC<AddOutputButtonProps> = ({ nodeId }) => {
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
};

interface DelOutputButtonProps {
    nodeId: string;
    handleId: string;
}
const DelOutputButton: FC<DelOutputButtonProps> = ({ nodeId, handleId }) => {
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
                        output: node.data.output.filter(({handleId}: IOutputInput) => handleId !== hId),
                    };
                }

                return node;
            })
        );
    };

    return (
        <button className={'nodrag del-output btn'} onClick={onDelOutput}>-</button>
    );
};

interface OutputProps {
    nodeId: string;
    value: string;
    handleId: string;
}
const Output: FC<OutputProps> = ({ value, handleId, nodeId }) => {
    const { setNodes } = useReactFlow();
    const store = useStoreApi();
    const hId = handleId;

    const onChange = (evt: ChangeEvent<HTMLInputElement>) => {
        const { nodeInternals } = store.getState();
        setNodes(
            Array.from(nodeInternals.values()).map((node) => {
                if (node.id === nodeId) {
                    node.data = {
                        ...node.data,
                        output: node.data.output.map(({name, handleId}: IOutputInput) => ({
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
        <div className={style.output}>
            <Handle className={style.handle} type="target" position={Position.Left} id={handleId} />

            <div className={style.outputBody}>
                <DelOutputButton nodeId={nodeId} handleId={handleId} />
                <input className="nodrag" onChange={onChange} value={value} />
            </div>
        </div>
    );
}

interface OutputNodeProps {
    id: string;
    data: any;
}
export const OutputNode: FC<OutputNodeProps> = ({ id, data }) => {
    return (
        <div className={style.outputNode}>
            <div className={style.header}>
              {
                !data.output.length && <Handle className={style.handle} type="target" position={Position.Left} id={`${id}-output`} />
              }
                <div><strong>{data.label}</strong></div>
                <AddOutputButton nodeId={id} />
            </div>
            <div className={style.body}>
                {data.output.map(({name, handleId}: IOutputInput) => (
                    <Output key={handleId} nodeId={id} value={name} handleId={handleId} />
                ))}
            </div>
            {data.type === 'map_output' ? (
                <Handle type="source" position={Position.Right} id={`${id}-map-output`} />
            ) : ''}
        </div>
    );
}
