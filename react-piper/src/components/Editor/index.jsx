import React, {useState, useRef, useCallback, useEffect} from 'react';
import useKeypress from 'react-use-keypress';

import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    MarkerType, SmoothStepEdge, useReactFlow, Position
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from '../Sidebar';

import './index.scss';
import InputNode from "../InputNode";
import FuncNode from "../FuncNode";
import MapNode from "../MapNode";
import OutputNode from "../OutputNode";
import { v4 as uuid4 } from 'uuid';
import {specToStr} from "../../utils/spec";



const nodeTypes = {
    input: InputNode,
    default: FuncNode,
    group: MapNode,
    output: OutputNode,
}

const edgeTypes = {
    default: SmoothStepEdge,
}

const flowKey = 'flow';

const getId = () => `dndnode_${uuid4()}`;

const Editor = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const { setViewport } = useReactFlow();

    const onSave = useCallback(() => {
        if (reactFlowInstance) {
            const flow = reactFlowInstance.toObject();
            localStorage.setItem(flowKey, JSON.stringify(flow));
        }
    }, [reactFlowInstance]);

    const onRestore = useCallback(() => {
        const restoreFlow = async () => {
            const flow = JSON.parse(localStorage.getItem(flowKey));

            if (flow) {
                const { x = 0, y = 0, zoom = 1 } = flow.viewport;
                setNodes(flow.nodes || []);
                setEdges(flow.edges || []);
                setViewport({ x, y, zoom });
            }
        };

        restoreFlow();
    }, [setNodes, setViewport, setEdges, nodes]);

    const onConnect = useCallback((params) => setEdges((eds) => {
        const source = nodes.filter(node => node.id === params.source)[0];
        const target = nodes.filter(node => node.id === params.target)[0];

        if (target.data.type === 'map_input') {
            const item_spec = source.data.output.value_type;
            setNodes(nodes => nodes.map(node => {
                if (node.id === target.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            input: {'item': item_spec},
                            output: item_spec,
                        }
                    };
                }
                return node;
            }))
        }

        return addEdge({
            ...params,
            markerEnd: {
                type: MarkerType.ArrowClosed,
            },
        }, eds)
    }), [setEdges, nodes, setNodes]);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, [nodes]);

    const getParentNode = useCallback((position) => {
        for (let i = nodes.length - 1; i >= 0; i--) {
            const {x, y} = position;
            const {width, height, positionAbsolute: pa, position: p} = nodes[i];
            const pos = pa || p;
            if (x < pos.x + width && x > pos.x && y < pos.y + height && y > pos.y) {
                return nodes[i]
            }
        }
    }, [nodes])

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const nodeSpec = JSON.parse(event.dataTransfer.getData('application/reactflow'));

            if (typeof nodeSpec === 'undefined' || !nodeSpec || !nodeSpec.type) {
                return;
            }

            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });
            const newNode = {
                id: getId(),
                type: nodeSpec.type,
                position,
                data: nodeSpec,
            };

            const parent = getParentNode(position);
            if (typeof parent !== 'undefined' && parent.id && parent.type === 'group') {
                newNode.parentNode = parent.id;
                newNode.extent = 'parent';
                newNode.position = {
                    x: position.x - (parent.positionAbsolute || parent.position).x,
                    y: position.y - (parent.positionAbsolute || parent.position).y,
                };
                newNode.positionAbsolute = position;
            }

            const newNodes = [newNode];
            if (newNode.type === 'group') {
                newNodes.push({
                    id: getId(),
                    type: 'default',
                    position: {x: 0, y: 0},
                    //draggable: false,
                    //selectable: false,
                    parentNode: newNode.id,
                    extent: 'parent',
                    data: {
                        label: 'Map Input',
                        type: 'map_input',
                        input: {'item': '?'},
                        output: '?',
                        extra_output: [],
                    },
                });
                newNodes.push({
                    id: getId(),
                    type: 'output',
                    position: {x: 75, y: 101},
                    parentNode: newNode.id,
                    //draggable: false,
                    //selectable: false,
                    extent: 'parent',
                    data: {
                        label: 'Map Output',
                        type: 'map_output',
                        output: [],
                    },
                });
            }

            setNodes((nds) => [...nds, ...newNodes]);
        },
        [reactFlowInstance, setNodes, getParentNode]
    );

    const deleteNode = (nodes) => {
        let _nodes = nodes.filter(node => !node.selected)
        while (true) {
            const nodeIds = new Set(_nodes.map(node => node.id));
            const len = _nodes.length;
            _nodes = _nodes.filter(node => !node.parentNode || nodeIds.has(node.parentNode));
            if (_nodes.length === len) {
                break;
            }
        }
        return _nodes;
    }

    useKeypress('Delete', () => {
        setNodes(nodes => deleteNode(nodes));
        setEdges(edges => edges.filter(edge => !edge.selected));
    });

    return (
        <div className="dndflow">
            <Sidebar />
            <div className="reactflow-wrapper" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    fitView
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    connectionLineType={'smoothstep'}

                >
                    <Controls />
                    <div className="save-controls">
                        <button onClick={onSave}>save</button>
                        <button onClick={onRestore}>restore</button>
                    </div>
                </ReactFlow>
            </div>
        </div>
    );
};

export default Editor;
