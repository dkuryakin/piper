import React, {memo, useCallback, useEffect, useRef, useState} from 'react';
import {Handle, useNodesState, useReactFlow, useStoreApi} from 'reactflow';
import './index.scss';
import { v4 as uuid4 } from 'uuid';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

function MapInput({ id, data }) {
    return (
        <div className={'map-input'}>
            <Handle type="target" position="left" id={`map-node-${id}-input`} />
            <div className="header">
                <strong>{data.label}: Input</strong>
            </div>
        </div>
    )
}

function MapOutput({ id, data }) {
    return (
        <div className={'map-output'}>
            <div className="header">
                <strong>{data.label}: Output</strong>
            </div>
            <Handle type="source" position="right" id={`map-node-${id}-output`} />
        </div>
    )
}

function MapNode({ id, data }) {
    const {setNodes} = useReactFlow();
    const store = useStoreApi();
    const [size, setSize] = useState({width: data.width, height: data.height})

    const onResize = (event, {element, size, handle}) => {
        setNodes(nodes => nodes.map(node => {
            if (node.id === id) {
                return {
                    ...node,
                    ...size,
                };
            }
            return node;
        }))
        setSize({...size});
    };

    return (
        <Resizable
            height={size.height}
            width={size.width}
            onResize={onResize}
            handle={<span className="react-resizable-handle react-resizable-handle-se nodrag" />}
        >
            <div
                className={'map-node'}
                style={{width: `${size.width}px`, height: `${size.height}px`}}
            >
                {/*<MapInput id={id} data={data} />*/}
                {/*<div className="body"></div>*/}
                {/*<MapOutput id={id} data={data} />*/}
            </div>
        </Resizable>
    );
}

export default memo(MapNode);
