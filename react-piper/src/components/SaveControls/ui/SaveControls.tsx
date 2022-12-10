import React, {ChangeEvent, FC, useCallback} from 'react';
import style from './SaveControls.module.css';
import {ReactFlowInstance, useReactFlow, Node, Edge} from 'reactflow';
import {PIPELINES_NAME} from '../../../constants';
import {v4 as uuidv4} from 'uuid';
import {message} from '../../../utils/toasts';
import {generateSpec} from '../../../utils/serialize';

interface SaveControlsProps {
  reactFlowInstance: ReactFlowInstance | null;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  nodes: Node[];
  edges: Edge[];
}
export const SaveControls: FC<SaveControlsProps> = ({reactFlowInstance, setNodes, setEdges, nodes, edges}) => {
  const {setViewport} = useReactFlow();
  const [pipelineName, setPipelineName] = React.useState('');
  const pipelineNamesFromStorage = JSON.parse(localStorage.getItem(PIPELINES_NAME) || "[]");
  const [pipelineNames, setPipelineNames] = React.useState(pipelineNamesFromStorage);
  const [selectedPipelineName, setSelectedPipelineName] = React.useState(pipelineNamesFromStorage ? pipelineNamesFromStorage[0] : '');

  const onChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
    setPipelineName(e.target.value);
  };

  const onChangeSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedPipelineName(e.target.value);
  };

  const onSave = useCallback(() => {
    if (!pipelineName) {
      message.error('Pipeline name is required');
      return;
    }

    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      localStorage.setItem(pipelineName, JSON.stringify(flow));

      const newPipelineNames = Array.from(new Set([...pipelineNames, pipelineName]));
      setPipelineNames(newPipelineNames);
      localStorage.setItem(PIPELINES_NAME, JSON.stringify(newPipelineNames));

      setPipelineName('');
      message.success('Pipeline name is saved');
    }
  }, [reactFlowInstance, pipelineName]);

  const onRestore = useCallback(async () => {
    if (!selectedPipelineName) {
      message.error('Pipeline name is not selected');
      return;
    }

    const restoreFlow = () => {
      const flow = JSON.parse(localStorage.getItem(selectedPipelineName) || '');

      if (flow) {
        const {x = 0, y = 0, zoom = 1} = flow.viewport;
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        setViewport({x, y, zoom});
      }
    };

    await restoreFlow();
  }, [setNodes, setViewport, setEdges, selectedPipelineName]);

  const onDelete = () => {
    if (!selectedPipelineName) {
      message.error('Pipeline name is not selected');
      return;
    }

    localStorage.removeItem(selectedPipelineName);
    const newPipelineNames = pipelineNames.filter((name: string) => name !== selectedPipelineName);
    setPipelineNames(newPipelineNames);
    localStorage.setItem(PIPELINES_NAME, JSON.stringify(newPipelineNames));
    setSelectedPipelineName(newPipelineNames[0]);
    message.success('Pipeline is deleted');
  };

  const onExport = (nodes: Node[], edges: Edge[]) => {
    const spec = JSON.stringify(generateSpec(nodes, edges));
    const a = document.createElement('a');
    a.setAttribute('download', `spec-${new Date().getTime()}.json`);
    a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(spec));
    a.click();
  }

  return (
    <div className={style.saveControls}>
      <div className={style.item}>
        <input
          className="default-input"
          type="text"
          placeholder="Pipeline name"
          value={pipelineName}
          onChange={onChangeInput}
        />
        <button className={`${style.button} default-button`} onClick={onSave}>Save</button>
      </div>
      <div className={style.item}>
        <label className={style.label}>
          Select pipeline name:
          <div className={style.selectBox}>
            <select
              className="default-input"
              onChange={onChangeSelect}
              value={selectedPipelineName}
            >
              {pipelineNames.map((name: string) => <option key={uuidv4()} value={name}>{name}</option>)}
            </select>
            <div className={style.buttons}>
              <button className={`default-button ${style.button}`} onClick={onRestore}>Restore</button>
              <button className={`default-button ${style.button}`} onClick={onDelete}>Delete</button>
            </div>
          </div>
        </label>
      </div>
      <button className={` default-button ${style.exportButton}`} onClick={() => onExport(nodes, edges)}>Export spec</button>
    </div>
  );
};