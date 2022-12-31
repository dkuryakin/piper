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
import { message } from "../../../utils/toasts";

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
  const params = getNode(nodeId)?.data?.params;
  const inputValue = params?.[name] || "";
  const [value, setValue] = React.useState(inputValue);
  const [checked, setChecked] = React.useState<boolean>(params?.hasOwnProperty(name));

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
      <div
        className={`${style.inputParamBody} ${checked ? style.checked : ""}`}
      >
        {spec.type === "string" && (
          <input
            className={style.checkbox}
            type="checkbox"
            checked={checked}
            onChange={onCheckboxChange}
          />
        )}
        {checked ? (
          <label className={style.paramsLabel}>
            <input
              placeholder="const value"
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
          <>
            {name}: {specToStr(spec, MAX_TYPE_LENGTH)}
          </>
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

interface StringMapperProps {
  regex: string;
  replacement: string;
  id: number;
  nodeId: string;
}

const StringMapper: FC<StringMapperProps> = memo(({ nodeId, id, regex, replacement }) => {
  const { setNodes, getNode } = useReactFlow();
  const nodes = useNodes();

  const onChange = (id: number, regex: string, replacement: string) => {
    const _nodes = nodes.map((node: any) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            params: {
              ...node.data.params,
              items: node.data.params.items.map((item: object, i: number) => {
                if (i === id) {
                  return [regex, replacement];
                }
                return item;
              }),
            },
          },
        };
      }

      return node;
    });
    setNodes(_nodes);
  };

  const onDelete = () => {
    const node = getNode(nodeId);
    if (node?.data?.params?.items?.length <= 1) {
      message.error("You can't delete the last string mapper");
      return;
    }
    const _nodes = nodes.map((node: any) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            params: {
              ...node.data.params,
              items: node.data.params.items.filter((item: object, i: number) => i !== id),
            },
          },
        };
      }

      return node;
    });
    setNodes(_nodes);
  };

  const onChangeRegExp = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(id, e.target.value, replacement);
  };

  const onChangeReplace = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(id, regex, e.target.value);
  };

  return (
    <div className={style.stringMapper}>
      <input
        className={style.stringMapperInput}
        value={regex}
        onChange={onChangeRegExp}
        type="text"
        placeholder="RegExp"
      />
      <input
        className={style.stringMapperInput}
        value={replacement}
        onChange={onChangeReplace}
        type="text"
        placeholder="Replacement"
      />
      <button
        className={style.delStringMapperButton}
        onClick={onDelete}
      >
        -
      </button>
    </div>
  );
});

interface StringMapProps {
  nodeId: string;
  data: any;
}

const StringMap: FC<StringMapProps> = memo(({ nodeId, data }) => {
  const { setNodes } = useReactFlow();
  const nodes = useNodes();

  const addStringMapper = () => {
    const _nodes = nodes.map((node: any) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            params: {
              ...node.data.params,
              items: [
                ...node.data.params.items,
                ["", ""]
              ]
            },
          },
        };
      }

      return node;
    });
    setNodes(_nodes);
  };

  const onChangeDefaultReplacement = (defaultReplacement: string) => {
    const _nodes = nodes.map((node: any) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            params: {
              ...node.data.params,
              default: defaultReplacement,
            },
          },
        };
      }

      return node;
    });
    setNodes(_nodes);
  };

  return (
    <div className={style.stringMap}>
      <div className={style.stringMappers}>
        {data?.params?.items?.map(([regex, replacement]: any, index: number) => (
          <div key={index}>
            <StringMapper regex={regex} replacement={replacement} id={index} nodeId={nodeId} />
          </div>
        ))}
      </div>
      <button className={style.addStringMapperButton} onClick={addStringMapper}>
        +
      </button>
      <input
          className={style.stringMapperInput}
          value={data?.params?.default}
          onChange={e => onChangeDefaultReplacement(e.target.value)}
          type="text"
          placeholder="Replacement"
      />
    </div>
  );
});

const renderHeader = ({ data }: any) => {
  return (
    data?.func === "remap_regex" && (
      <div className={style.header}>
        <div>
          <strong>{data?.label}</strong>
        </div>
      </div>
    )
  );
};

interface FuncNodeProps {
  id: string;
  data: any;
}

export const FuncNode: FC<FuncNodeProps> = memo(({ id, data }) => {
  return (
    <div className={`${style.funcNode} string_mapper`}>
      {renderHeader(data)}
      <div className={style.body}>
        {data?.func === "remap_regex" && <StringMap nodeId={id} data={data} />}
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
