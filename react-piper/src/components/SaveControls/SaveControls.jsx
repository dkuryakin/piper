import React, {useCallback} from 'react';
import './index.scss';
import {useReactFlow} from 'reactflow';
import {PIPELINES_NAME} from '../../constants';
import {v4 as uuidv4} from 'uuid';
import {message} from '../../utils/toasts';

export const SaveControls = ({reactFlowInstance, setNodes, setEdges}) => {
  const {setViewport} = useReactFlow();
  const [pipelineName, setPipelineName] = React.useState('');
  const pipelineNamesFromStorage = JSON.parse(localStorage.getItem(PIPELINES_NAME));
  const [pipelineNames, setPipelineNames] = React.useState(pipelineNamesFromStorage || []);
  const [selectedPipelineName, setSelectedPipelineName] = React.useState(pipelineNamesFromStorage ? pipelineNamesFromStorage[0] : '');

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPipelineName(e.target.value);
  };

  const onChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

      const newPipelineNames = [...new Set([...pipelineNames, pipelineName])];
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
      const flow = JSON.parse(localStorage.getItem(selectedPipelineName));

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
    const newPipelineNames = pipelineNames.filter(name => name !== selectedPipelineName);
    setPipelineNames(newPipelineNames);
    localStorage.setItem(PIPELINES_NAME, JSON.stringify(newPipelineNames));
    setSelectedPipelineName(newPipelineNames[0]);
    message.success('Pipeline is deleted');
  };

  return (
    <div className="save-controls">
      <div className="save-controls__item">
        <input
          className="save-controls__input"
          type="text"
          placeholder="Введите название"
          value={pipelineName}
          onChange={onChangeInput}
        />
        <button className="save-controls__button" onClick={onSave}>save</button>
      </div>
      <div className="save-controls__item">
        <label className="save-controls__label">
          Select pipeline name:
          <div className="save-controls__select-box">
            <select
              className="save-controls__select"
              onChange={onChangeSelect}
              value={selectedPipelineName}
            >
              {pipelineNames.map((name) => <option key={uuidv4()} value={name}>{name}</option>)}
            </select>
            <div className="save-controls__buttons">
              <button className="save-controls__button" onClick={onRestore}>restore</button>
              <button className="save-controls__button" onClick={onDelete}>delete</button>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};