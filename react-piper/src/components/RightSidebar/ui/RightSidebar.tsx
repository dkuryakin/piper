import React, { FC } from "react";
import { SidebarLayout } from "../../SidebarLayout/SidebarLayout";
import { DownloadPipelineImage } from "../../DownloadPipelineImage";
import { SaveControls } from "../../SaveControls";
import { Edge, Node, ReactFlowInstance } from "reactflow";
import style from "./RightSidebar.module.css";
import { ArrowPosition } from "../../../types";
import { NodeInfo } from "../../NodeInfo/NodeInfo";

interface RightSidebarProps {
  nodes: Node[];
  edges: Edge[];
  reactFlowInstance: ReactFlowInstance | null;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectedNode: Node | null;
}

export const RightSidebar: FC<RightSidebarProps> = ({
  reactFlowInstance,
  setNodes,
  nodes,
  edges,
  setEdges,
  selectedNode,
}) => {
  return (
    <SidebarLayout
      className={style.sidebar}
      arrowPosition={ArrowPosition.Right}
      arrowClassName={style.arrow}
    >
      <DownloadPipelineImage />
      <SaveControls
        nodes={nodes}
        edges={edges}
        reactFlowInstance={reactFlowInstance}
        setNodes={setNodes}
        setEdges={setEdges}
      />
      <NodeInfo selectedNode={selectedNode} />
    </SidebarLayout>
  );
};
