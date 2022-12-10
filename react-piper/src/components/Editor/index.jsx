import React, {useCallback, useRef, useState} from 'react';
import useKeypress from 'react-use-keypress';
import {generateSpec} from "../../utils/serialize";
import ReactFlow, {
    addEdge,
    Controls,
    MarkerType,
    ReactFlowProvider,
    SmoothStepEdge,
    useEdgesState,
    useNodesState,
    useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from '../Sidebar';

import './index.scss';
import InputNode from "../InputNode";
import FuncNode from "../FuncNode";
import MapNode from "../MapNode";
import OutputNode from "../OutputNode";
import {v4 as uuid4} from 'uuid';
import {SaveControls} from '../SaveControls/SaveControls';
import {DownloadPipelineImage} from '../DownloadPipelineImage/DownloadPipelineImage';


const nodeTypes = {
    input: InputNode,
    default: FuncNode,
    group: MapNode,
    output: OutputNode,
}

const edgeTypes = {
  default: SmoothStepEdge,
};

const getId = () => `dndnode_${uuid4()}`;

const EditorWithNoProvider = ({specs_url}) => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    const nodeExists = (nodes, nodeId) => nodes.filter(node => node.id === nodeId).length > 0

    const onConnect = useCallback((params) => setEdges((eds) => {
        const source = nodes.filter(node => node.id === params.source)[0];
        const target = nodes.filter(node => node.id === params.target)[0];

        if (target.data.type === 'map_input') {
            let item_spec;
            item_spec = source.data.extra_output.filter(({handleId}) => handleId === params.sourceHandle);
            if (item_spec.length === 0) {
                item_spec = source.data.output.value_type;
            } else {
                item_spec = item_spec[0].spec.value_type;
            }

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
    }, []);

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
        setNodes(nodes => {
            const _nodes = deleteNode(nodes);
            setEdges(edges => edges.filter(edge => !edge.selected && nodeExists(_nodes, edge.source) && nodeExists(_nodes, edge.target)));
            return _nodes;
        });
    });

    return (
        <div className="dndflow">
            <Sidebar specs_url={specs_url}/>
            <div className="reactflow-wrapper" ref={reactFlowWrapper}>
                <DownloadPipelineImage />
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
                    <Controls/>
                    <SaveControls
                      nodes={nodes}
                      edges={edges}
                      reactFlowInstance={reactFlowInstance}
                      setNodes={setNodes}
                      setEdges={setEdges}
                    />
                </ReactFlow>
            </div>
        </div>
    );
};

const Editor = ({specs_url}) => {
    return (
        <ReactFlowProvider>
            <EditorWithNoProvider specs_url={specs_url}/>
        </ReactFlowProvider>
    )
}

export default Editor;
