import React, {memo, useState} from 'react';
import {useReactFlow} from 'reactflow';
import './index.scss';
import {Resizable} from 'react-resizable';
import 'react-resizable/css/styles.css';


function MapNode({id, data}) {
    const {setNodes} = useReactFlow();
    const [size, setSize] = useState({width: data.width, height: data.height})

    const onResize = (event, {element, size, handle}) => {
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
