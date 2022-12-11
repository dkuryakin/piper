import React, { FC } from "react";
import { Node } from "reactflow";
import style from "./NodeInfo.module.css";

interface NodeInfoProps {
  selectedNode: Node | null;
}

export const NodeInfo: FC<NodeInfoProps> = ({ selectedNode }) => {
  return selectedNode && selectedNode?.data.label !== "Map" ? (
    <div className={style.info}>
      <h2 className={style.name}>{selectedNode?.data.label}</h2>
      {selectedNode?.data?.input && (
        <div className={style.item}>
          <h3 className={style.text}>Input</h3>
          <pre className={style.code}>
            <code>{JSON.stringify(selectedNode?.data?.input, null, 2)}</code>
          </pre>
        </div>
      )}
      {selectedNode?.data?.output && (
        <div className={style.item}>
          <h3 className={style.text}>Output</h3>
          <pre className={style.code}>
            <code>{JSON.stringify(selectedNode?.data?.output, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  ) : (
    <div></div>
  );
};
