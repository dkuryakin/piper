import React, {FC, memo, useState} from 'react';
import {useReactFlow} from 'reactflow';
import {Resizable} from 'react-resizable';
import 'react-resizable/css/styles.css';

interface MapNodeProps {
    data: any;
    id: string;
}
export const MapNode: FC<MapNodeProps> = memo(({id, data}) => {
    const {setNodes} = useReactFlow();
    const [size, setSize] = useState({width: data.width, height: data.height})

    const onResize = (event: any, {element, size, handle}: any) => {
        setNodes(nodes => nodes.map(node => {
            if (node.id === id) {
                return {
                    ...node,
                    ...size,
                    data: {
                        ...node.data,
                        ...size,
                    }
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
            handle={<span className="react-resizable-handle react-resizable-handle-se nodrag"/>}
        >
            <div
                style={{width: `${size.width}px`, height: `${size.height}px`}}
            >
            </div>
        </Resizable>
    );
});
