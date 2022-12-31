import React, {
  DragEvent,
  FC,
  MouseEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { useKeyPress } from "../../../hooks/useKeyPress";
import ReactFlow, {
  addEdge,
  Connection,
  ConnectionLineType,
  Controls,
  MarkerType,
  Node,
  ReactFlowInstance,
  ReactFlowProvider,
  SmoothStepEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { LeftSidebar } from "../../LeftSidebar";

import "./Editor.css";
import { InputNode } from "../../InputNode";
import { FuncNode } from "../../FuncNode";
import { MapNode } from "../../MapNode";
import { OutputNode } from "../../OutputNode";
import { v4 as uuid4 } from "uuid";
import { IExtraOutput } from "../../../types";
import { RightSidebar } from "../../RightSidebar";
import { getParentNodeIds } from "../../../utils/getParentNodeIds";
import { isNodeNested } from "../../../utils/isNodeNested";

const nodeTypes = {
  input: InputNode,
  default: FuncNode,
  group: MapNode,
  output: OutputNode,
};

const edgeTypes = {
  default: SmoothStepEdge,
};

const getId = () => `dndnode_${uuid4()}`;

const initialNodes: Node[] = [
  {
    id: getId(),
    type: "input",
    position: { x: -225, y: -200 },
    data: { type: "input", label: "Input", input: [] },
  },
  {
    id: getId(),
    type: "output",
    position: { x: 225, y: 200 },
    data: { type: "output", label: "Output", output: [] },
  },
];
const unRemovableNodeTypes = ["input", "output", "map_input", "map_output"];

interface EditorWithNoProviderProps {
  specs_url: string;
}

const EditorWithNoProvider: FC<EditorWithNoProviderProps> = ({ specs_url }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { getIntersectingNodes } = useReactFlow();
  const { deleteElements } = useReactFlow();
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const selectedNodes = nodes.filter((n) => n.selected);
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => {
        const source = nodes.filter(
          (node: Node) => node.id === params.source
        )[0];
        const target = nodes.filter(
          (node: Node) => node.id === params.target
        )[0];

        if (target.data.type === "map_input") {
          let item_spec = source.data.extra_output.filter(
            ({ handleId }: IExtraOutput) => handleId === params.sourceHandle
          );
          if (item_spec.length === 0) {
            item_spec = source.data.output.value_type;
          } else {
            item_spec = item_spec[0].spec.value_type;
          }

          setNodes((nodes: Node[]) =>
            nodes.map((node) => {
              if (node.id === target.id) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    input: { item: item_spec },
                    output: item_spec,
                  },
                };
              }
              return node;
            })
          );
        }

        return addEdge(
          {
            ...params,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          eds
        );
      }),
    [setEdges, nodes, setNodes]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const getParentNode = useCallback(
    (position: { x: number; y: number }) => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const { x, y } = position;
        const { width, height, positionAbsolute: pa, position: p } = nodes[i];
        const pos = pa || p;
        if (
          x < pos.x + (width || 0) &&
          x > pos.x &&
          y < pos.y + (height || 0) &&
          y > pos.y
        ) {
          return nodes[i];
        }
      }
    },
    [nodes]
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (reactFlowWrapper.current) {
        const current = reactFlowWrapper.current as HTMLDivElement;
        const reactFlowBounds = current.getBoundingClientRect();
        const nodeSpec = JSON.parse(
          event.dataTransfer.getData("application/reactflow")
        );

        if (typeof nodeSpec === "undefined" || !nodeSpec || !nodeSpec.type) {
          return;
        }

        const position = reactFlowInstance?.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        }) || { x: 0, y: 0 };
        const newNode: Node = {
          id: getId(),
          type: nodeSpec.type,
          position,
          data: nodeSpec,
        };

        const parent = getParentNode(position);
        if (
          typeof parent !== "undefined" &&
          parent.id &&
          parent.type === "group"
        ) {
          newNode.parentNode = parent.id;
          newNode.extent = "parent";
          newNode.position = {
            x: position.x - (parent.positionAbsolute || parent.position).x,
            y: position.y - (parent.positionAbsolute || parent.position).y,
          };
          newNode.positionAbsolute = position;
        }

        const newNodes = [newNode];
        if (newNode.type === "group") {
          newNodes.push({
            id: getId(),
            type: "default",
            position: { x: 0, y: 0 },
            //draggable: false,
            //selectable: false,
            parentNode: newNode.id,
            extent: "parent",
            data: {
              label: "Map Input",
              type: "map_input",
              input: { item: "?" },
              output: "?",
              extra_output: [],
            },
          });
          newNodes.push({
            id: getId(),
            type: "output",
            position: { x: 75, y: 101 },
            parentNode: newNode.id,
            //draggable: false,
            //selectable: false,
            extent: "parent",
            data: {
              label: "Map Output",
              type: "map_output",
              output: [],
            },
          });
        }

        setNodes((nds) => [...nds, ...newNodes]);
      }
    },
    [reactFlowInstance, setNodes, getParentNode]
  );

  useKeyPress(["Delete"], () => {
    const nodesToDelete = nodes.filter(
      (node) => node.selected && !unRemovableNodeTypes.includes(node.data.type)
    );
    const edgesToDelete = edges.filter((edge) => edge.selected);

    const mapInputIds = nodesToDelete.map((node) => {
      const edge = edges.find((edge) => edge.source === node.id);
      const targetNode = nodes.find((n) => n.id === edge?.target);
      if (targetNode?.data.type === "map_input") {
        return targetNode.id;
      }
      return null;
    }).filter((item) => item !== null);

    edgesToDelete.forEach((edge) => {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (targetNode?.data.type === "map_input") {
        mapInputIds.push(targetNode.id);
      }
    });

    const newNodes = nodes.map((node) => {
      if (mapInputIds.includes(node.id)) {
        node.data = {
          ...node.data,
          input: { item: "?" },
          output: "?",
          extra_output: [],
          params: {},
        };
      }
      return node;
    });

    const extraEdgesToDelete = edges.filter((edge) =>
      mapInputIds.includes(edge.source)
    );

    setNodes(newNodes);

    deleteElements({
      nodes: nodesToDelete,
      edges: edgesToDelete.concat(extraEdgesToDelete),
    });
  });

  const onNodeDrag = useCallback(
    (_: MouseEvent, node: Node) => {
      let intersections: string[] = getIntersectingNodes(node)
        .map((n) => n.id)
        .filter((id) => {
          const n = nodes.find((n) => n.id === id);
          return n && n.type === "group";
        });
      if (node?.type === "group" || node?.parentNode) {
        const prevParentNodesIds = getParentNodeIds(nodes, node);
        intersections = intersections.filter((id: string) => {
          const n = nodes.find((n) => n.id === id);
          if (n && isNodeNested(nodes, n, node)) {
            prevParentNodesIds.push(n.id);
          }
          return !prevParentNodesIds.includes(id);
        });
      }

      setNodes((nodes) =>
        nodes.map((n) => ({
          ...n,
          className: intersections.includes(n.id)
            ? "intersects"
            : n.id === node.id && intersections.length
            ? "intersects-drag"
            : "",
        }))
      );
    },
    [nodes, getIntersectingNodes, setNodes]
  );
  return (
    <div className="dndflow">
      <LeftSidebar specs_url={specs_url} />
      <div className="reactflow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDrag={onNodeDrag}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
        >
          <Controls />
        </ReactFlow>
      </div>
      <RightSidebar
        selectedNode={selectedNode}
        nodes={nodes}
        edges={edges}
        reactFlowInstance={reactFlowInstance}
        setNodes={setNodes}
        setEdges={setEdges}
      />
    </div>
  );
};

interface EditorProps {
  specs_url: string;
}

export const Editor: FC<EditorProps> = ({ specs_url }) => {
  return (
    <ReactFlowProvider>
      <EditorWithNoProvider specs_url={specs_url} />
    </ReactFlowProvider>
  );
};
