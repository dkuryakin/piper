import React, { ChangeEvent, FC, memo } from "react";
import { Handle, Position, useEdges, useNodes, useReactFlow } from "reactflow";
import style from "./FuncNode.module.css";
import { v4 as uuid4 } from "uuid";
import {
  isValidConnection,
  specToOptions,
  specToStr,
} from "../../../utils/spec";
import { IExtraOutput } from "../../../types";
import { MAX_TYPE_LENGTH } from "../../../constants";
import { objectSetOrExcludeField } from "../../../utils/objects";

interface AddOutputButtonProps {
  nodeId: string;
  spec: any;
}

const AddOutputButton: FC<AddOutputButtonProps> = ({ nodeId, spec }) => {
  const options: any = specToOptions(spec);
  const val = Object.keys(options)[0];

  const { setNodes } = useReactFlow();

  const onAddOutput = () => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            extra_output: [
              ...node.data.extra_output,
              { name: val, handleId: uuid4(), spec: options[val] },
            ],
          };
        }

        return node;
      })
    );
  };

  return (
    <button
      className={"nodrag add-output btn"}
      onClick={onAddOutput}
      disabled={Object.keys(options).length === 0}
    >
      +
    </button>
  );
};

interface DelOutputButtonProps {
  nodeId: string;
  handleId: string;
}

const DelOutputButton: FC<DelOutputButtonProps> = ({ nodeId, handleId }) => {
  const { setNodes, setEdges } = useReactFlow();
  const hId = handleId;
  const onDelInput = () => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            extra_output: node.data.extra_output.filter(
              ({ handleId }: IExtraOutput) => handleId !== hId
            ),
          };
        }

        return node;
      })
    );

    setEdges((edges) =>
      edges.filter(({ sourceHandle }) => sourceHandle !== hId)
    );
  };

  return (
    <button className={"nodrag del-output btn"} onClick={onDelInput}>
      -
    </button>
  );
};

interface InputParamProps {
  nodeId: string;
  handleId: string;
  spec: any;
  name: string;
}

const InputParam: FC<InputParamProps> = ({ name, spec, handleId, nodeId }) => {
  const edges = useEdges();
  const nodes = useNodes();
  const { setNodes, getNode, deleteElements } = useReactFlow();
  const targetEdge = edges.find((edge) => edge.targetHandle === handleId);
  const inputValue = getNode(nodeId)?.data?.params?.[name] || "";
  const [value, setValue] = React.useState(inputValue);
  const [checked, setChecked] = React.useState<boolean>(false);

  const onCheckboxChange = () => {
    setChecked(!checked);

    targetEdge &&
      deleteElements({
        edges: [targetEdge],
      });
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            params: objectSetOrExcludeField(
              node.data.params,
              name,
              e.target.value
            ),
          };
        }

        return node;
      })
    );
    setValue(e.target.value);
  };

  return (
    <div className={style.inputParam}>
      {spec.type === "string" && (
        <label className={style.checkboxWrapper}>
          <input
            className={style.checkbox}
            type="checkbox"
            checked={checked}
            onChange={onCheckboxChange}
          />
          <span className={style.label}>params</span>
        </label>
      )}
      {!checked && (
        <Handle
          className={`${style.inputHandle} ${
            spec.type === "string" ? style.paramsInputHandle : ""
          }`}
          type="target"
          position={Position.Left}
          id={handleId}
          isValidConnection={(connection) =>
            isValidConnection(connection, nodes, edges)
          }
        />
      )}
      <div className={style.inputParamBody}>
        {checked ? (
          <label className={style.paramsLabel}>
            <input
              placeholder="Посхалка для Давида"
              className={style.paramsInput}
              type="text"
              value={value}
              onChange={onChange}
            />
            <span className={style.paramsSpan}>
              {name}: {specToStr(spec, MAX_TYPE_LENGTH)}
            </span>
          </label>
        ) : (
          <div>
            {name}: {specToStr(spec, MAX_TYPE_LENGTH)}
          </div>
        )}
      </div>
    </div>
  );
};

interface OutputProps {
  spec: any;
  handleId: string;
  nodeId: string;
}

const Output: FC<OutputProps> = ({ spec, handleId, nodeId }) => {
  const nodes = useNodes();
  const edges = useEdges();

  return (
    <div className={style.output}>
      <AddOutputButton nodeId={nodeId} spec={spec} />
      <div className={style.outputBody}>{specToStr(spec, MAX_TYPE_LENGTH)}</div>
      <Handle
        className={style.outputHandle}
        type="source"
        position={Position.Right}
        id={handleId}
        isValidConnection={(connection) =>
          isValidConnection(connection, nodes, edges)
        }
      />
    </div>
  );
};

interface InputProps {
  nodeId: string;
  hId: string;
  index: number;
}

const Input: FC<InputProps> = ({ nodeId, hId, index }) => {
  const { setNodes, getNode } = useReactFlow();
  const extraOutput = getNode(nodeId)?.data?.extra_output?.find(
    (output: IExtraOutput) => output.handleId === hId
  );
  const nodeIndex = extraOutput?.indexes ? extraOutput.indexes[index] : "0";
  const [value, setValue] = React.useState(nodeIndex);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const correctValue = e.target.value === "" ? "0" : e.target.value;
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            extra_output: node.data.extra_output.map((output: IExtraOutput) => {
              if (output.handleId === hId) {
                output.indexes = { ...output.indexes, [index]: correctValue };
              }
              return output;
            }),
          };
        }

        return node;
      })
    );
    setValue(correctValue);
  };

  return (
    <input
      className="nodrag mt5"
      min="0"
      step="1"
      type={"number"}
      value={value}
      onChange={onChange}
    />
  );
};

interface ExtraOutputProps {
  value: string;
  spec: any;
  handleId: string;
  nodeId: string;
}

const ExtraOutput: FC<ExtraOutputProps> = ({
  value,
  spec,
  handleId,
  nodeId,
}) => {
  const options: any = specToOptions(spec);

  const { setNodes } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();
  const hId = handleId;

  const onChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    const _nodes = nodes.map((node: any) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            extra_output: node.data.extra_output.map(
              ({ name, handleId }: IExtraOutput) => ({
                name: hId === handleId ? evt.target.value : name,
                handleId,
                spec: options[hId === handleId ? evt.target.value : name],
              })
            ),
          },
        };
      }

      return node;
    });
    setNodes(_nodes);
  };

  if (Object.keys(options).length === 0) {
    return <></>;
  }

  return (
    <div className={style.extraOutput}>
      <div className={style.extraOutputBody}>
        <DelOutputButton nodeId={nodeId} handleId={handleId} />
        <div className={style.options}>
          <select className="nodrag" onChange={onChange} value={value}>
            {Object.keys(options).map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
          {Array.from(value.matchAll(/\[([^\]]+)]/g)).map((param, i) => {
            const type = param[1]; // i, key, ...
            if (type === "i") {
              return <Input key={i} index={i} nodeId={nodeId} hId={hId} />;
            }
            return "";
          })}
        </div>
      </div>
      <Handle
        className={style.handle}
        type="source"
        position={Position.Right}
        id={handleId}
        isValidConnection={(connection) =>
          isValidConnection(connection, nodes, edges)
        }
      />
    </div>
  );
};

interface FuncNodeProps {
  id: string;
  data: any;
}

export const FuncNode: FC<FuncNodeProps> = memo(({ id, data }) => {
  return (
    <div className={style.funcNode}>
      <div className={style.header}>
        <div>
          <strong>{data.label}</strong>
        </div>
      </div>
      <div className={style.body}>
        {Object.keys(data.input).map((param_name) => (
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
      {data.extra_output.map(({ name, handleId }: IExtraOutput) => (
        <ExtraOutput
          key={handleId}
          nodeId={id}
          value={name}
          spec={data.output}
          handleId={handleId}
        />
      ))}
    </div>
  );
});
