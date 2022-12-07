import React, {useEffect, useState} from 'react';
import {specToNodes} from "../../utils/spec";

const Sidebar = ({specs_url}) => {
    const [specs, setSpecs] = useState(null);

    const onDragStart = (event, nodeSpec) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeSpec));
        event.dataTransfer.effectAllowed = 'move';
    };

    useEffect(() => {
        fetch(specs_url).then(res => res.json()).then(spec => setSpecs([
            {
                label: 'Input',
                type: 'input',
                input: [],
            },
            {
                label: 'Output',
                type: 'output',
                output: [],
            },
            {
                label: 'Map',
                type: 'group',
                func: 'map',
                width: 203,
                height: 123,
                zIndex: -1,
            },
            ...specToNodes(spec),
        ]))
    }, [setSpecs, specs_url])

    return (
        <aside>
            <div className="description">Functions</div>
            {specs === null ? '' : specs.map((nodeSpec, i) => (
                <div
                    className={`dndnode ${nodeSpec.type}`}
                    onDragStart={(event) => onDragStart(event, nodeSpec)}
                    draggable
                    key={i}
                >
                    {nodeSpec.label}
                </div>
            ))}
        </aside>
    );
};

export default Sidebar;