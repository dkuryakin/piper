import React, {memo} from 'react';
import {Handle, useReactFlow, useStoreApi} from 'reactflow';
import './index.scss';
import {v4 as uuid4} from 'uuid';
import {isValidConnection, specToOptions, specToStr} from '../../utils/spec';

function AddOutputButton({nodeId, spec}) {
  const options = specToOptions(spec);
  const val = Object.keys(options)[0];

  const {setNodes} = useReactFlow();
  const store = useStoreApi();

  const onAddOutput = () => {
    const {nodeInternals} = store.getState();
    setNodes(
      Array.from(nodeInternals.values()).map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            extra_output: [
              ...node.data.extra_output,
              {name: val, handleId: uuid4(), spec: options[val]},
            ],
          };
        }

        return node;
      }),
    );
  };

  return (
    <button className={'nodrag add-output btn'} onClick={onAddOutput}
            disabled={Object.keys(options).length === 0}>+</button>
  );
}

function DelOutputButton({nodeId, handleId}) {
  const {setNodes} = useReactFlow();
  const store = useStoreApi();
  const hId = handleId;

  const onDelInput = () => {
    const {nodeInternals} = store.getState();
    setNodes(
      Array.from(nodeInternals.values()).map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            extra_output: node.data.extra_output.filter(({handleId}) => handleId !== hId),
          };
        }

        return node;
      }),
    );
  };

  return (
    <button className={'nodrag del-output btn'} onClick={onDelInput}>-</button>
  );
}


function InputParam({name, spec, handleId, nodeId}) {
  const store = useStoreApi();

  return (
    <div className="input-param">
      <Handle type="target" position="left" id={handleId}
              isValidConnection={(connection) => isValidConnection(connection, Array.from(store.getState().nodeInternals.values()))}/>
      <div className={'input-param-body'}>
        {name}: {specToStr(spec)}
      </div>
    </div>
  );
}

function Output({spec, handleId, nodeId}) {
  const store = useStoreApi();

  return (
    <div className="output">
      <AddOutputButton nodeId={nodeId} spec={spec}/>
      <div className={'output-body'}>
        {specToStr(spec)}
      </div>
      <Handle type="source" position="right" id={handleId}
              isValidConnection={(connection) => isValidConnection(connection, Array.from(store.getState().nodeInternals.values()))}/>
    </div>
  );
}

function Input({nodeId, hId, index}) {
  const store = useStoreApi();
  const {setNodes} = useReactFlow();
  const [value, setValue] = React.useState('0');

  const onChange = (e) => {
    const correctValue = e.target.value === '' ? '0' : e.target.value;
    const {nodeInternals} = store.getState();
    setNodes(
      Array.from(nodeInternals.values()).map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            extra_output: node.data.extra_output.map((output) => {
              if (output.handleId === hId) {
                output.indexes = {...output.indexes, [index]: correctValue};
              }
              return output;
            }),
          };
        }

        return node;
      }),
    );
    setValue(correctValue);
  };

  return (
    <input
      className="nodrag mt5"
      min="0"
      step="1"
      type={'number'}
      value={value}
      onChange={onChange}
    />
  );
}

function ExtraOutput({value, spec, handleId, nodeId}) {
  const options = specToOptions(spec);

  const {setNodes} = useReactFlow();
  const store = useStoreApi();
  const hId = handleId;

  const onChange = (evt) => {
    const {nodeInternals} = store.getState();
    const _nodes = Array.from(nodeInternals.values()).map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            extra_output: node.data.extra_output.map(({name, handleId}) => ({
              name: hId === handleId ? evt.target.value : name,
              handleId,
              spec: options[hId === handleId ? evt.target.value : name],
            })),
          },
        };
      }

      return node;
    });
    setNodes(_nodes);
  };

  if (Object.keys(options).length === 0) {
    return '';
  }

  return (
    <div className="extra-output">
      <div className={'extra-output-body'}>
        <DelOutputButton nodeId={nodeId} handleId={handleId}/>
        <div className={'options'}>
          <select className="nodrag" onChange={onChange} value={value}>
            {Object.keys(options).map(option => (
              <option value={option} key={option}>{option}</option>
            ))}
          </select>
          {[...value.matchAll(/\[([^\]]+)]/g)].map((param, i) => {
            const type = param[1];  // i, key, ...
            if (type === 'i') {
              return (
                <Input key={i} index={i} nodeId={nodeId} hId={hId} />
              );
            }
            return '';
          })}
        </div>
      </div>
      <Handle type="source" position="right" id={handleId}
              isValidConnection={(connection) => isValidConnection(connection, Array.from(store.getState().nodeInternals.values()))}/>
    </div>
  );
}


function FuncNode({id, data}) {
  return (
    <div className={'func-node'}>
      <div className="header">
        <div><strong>{data.label}</strong></div>
      </div>
      <div className="body">
        {Object.keys(data.input).map(param_name => (
          <InputParam
            key={param_name}
            nodeId={id}
            name={param_name}
            spec={data.input[param_name]}
            handleId={`func-node-${id}-input.${param_name}`}
          />
        ))}
      </div>
      <Output
        nodeId={id}
        spec={data.output}
        handleId={`func-node-${id}-output`}
      />
      {data.extra_output.map(({name, handleId}) => (
        <ExtraOutput key={handleId} nodeId={id} value={name} spec={data.output} handleId={handleId}/>
      ))}
    </div>
  );
}

export default memo(FuncNode);
