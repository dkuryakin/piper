import React, { DragEvent, FC, useEffect, useState } from "react";
import { specToNodes } from "../../../utils/spec";
import style from "./LeftSidebar.module.css";
import question from "../../../shared/assets/images/question.svg";
import { SidebarLayout } from "../../SidebarLayout/SidebarLayout";
import { ArrowPosition } from "../../../types";

const specMock = [
  {
    func: "read_image",
    input: { filename: { type: "string" }, data: { type: "bytes" } },
    output: { type: "array", value_type: { type: "tensor" } },
    description: "Converts any bytestream into the ndarray image.",
  },
  {
    func: "find_documents",
    input: { image: { type: "tensor" } },
    output: {
      type: "array",
      value_type: {
        type: "object",
        value_type: {
          image: { type: "tensor" },
          coords: {
            type: "array",
            value_type: {
              type: "tuple",
              value_type: [{ type: "integer" }, { type: "integer" }],
            },
          },
        },
      },
    },
    description: "Find documents on the image.",
  },
  {
    func: "enrich_list",
    input: { items: { type: "array", value_type: { type: "any" } } },
    output: {
      type: "array",
      value_type: {
        type: "dict",
        key_type: { type: "string" },
        value_type: { type: "any" },
      },
    },
    description:
      "\n    Transforms list of items from form of:\n    [i0, i1, i2, ...]\n    to following form:\n    [\n        {'item': i0, key1=val1, key2=val2, ...},\n        {'item': i1, key1=val1, key2=val2, ...},\n        {'item': i2, key1=val1, key2=val2, ...},\n        ...\n    ]\n    ",
  },
  {
    func: "classify_document",
    input: {
      image: { type: "tensor" },
      coords: {
        type: "array",
        value_type: {
          type: "tuple",
          value_type: [{ type: "integer" }, { type: "integer" }],
        },
      },
    },
    output: {
      type: "object",
      value_type: {
        image: { type: "tensor" },
        type: { type: "string" },
        rotation: { type: "integer" },
        coords: {
          type: "array",
          value_type: {
            type: "tuple",
            value_type: [{ type: "integer" }, { type: "integer" }],
          },
        },
        confidence: { type: "float" },
      },
    },
    description: "Classify document type (string).",
  },
  {
    func: "find_fields",
    input: {
      image: { type: "tensor" },
      document_type: { type: "string" },
      coords: {
        type: "union",
        value_type: [
          {
            type: "array",
            value_type: {
              type: "tuple",
              value_type: [{ type: "integer" }, { type: "integer" }],
            },
          },
          { type: "none" },
        ],
      },
    },
    output: {
      type: "array",
      value_type: {
        type: "object",
        value_type: {
          name: { type: "string" },
          crops: {
            type: "array",
            value_type: {
              type: "object",
              value_type: {
                image: { type: "tensor" },
                coords: {
                  type: "array",
                  value_type: {
                    type: "tuple",
                    value_type: [{ type: "integer" }, { type: "integer" }],
                  },
                },
              },
            },
          },
          whole_crops: {
            type: "array",
            value_type: {
              type: "object",
              value_type: {
                image: { type: "tensor" },
                coords: {
                  type: "array",
                  value_type: {
                    type: "tuple",
                    value_type: [{ type: "integer" }, { type: "integer" }],
                  },
                },
              },
            },
          },
        },
      },
    },
    description: "Extract fields crops from image with known document type.",
  },
  {
    func: "ocr_many",
    input: {
      images: { type: "array", value_type: { type: "tensor" } },
      document_type: { type: "string" },
      field_name: { type: "string" },
    },
    output: {
      type: "object",
      value_type: { text: { type: "string" }, confidence: { type: "float" } },
    },
    description: "Convert image with text to string and confidence.",
  },
  {
    func: "string_map",
    input: {
      value: { type: "string" },
    },
    output: {
      type: "string",
    },
    description: "Match a string to the form specified in the RegExp",
  },
];

const nodeSpec = [
  {
    label: "Map",
    type: "group",
    func: "map",
    width: 203,
    height: 123,
    zIndex: -1,
  },
];

interface LeftSidebarProps {
  specs_url: string;
}

export const LeftSidebar: FC<LeftSidebarProps> = ({ specs_url }) => {
  const [specs, setSpecs] = useState<any>(null);

  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeSpec: any) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(nodeSpec)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  useEffect(() => {
    if (!specs_url) {
      return setSpecs([...nodeSpec, ...specToNodes(specMock)]);
    }

    fetch(specs_url)
      .then((res) => res.json())
      .then((spec) => setSpecs([...nodeSpec, ...specToNodes(spec)]));
  }, [setSpecs, specs_url]);

  return (
    <SidebarLayout
      className={`${style.sidebar}`}
      arrowPosition={ArrowPosition.Left}
      arrowClassName={style.arrow}
    >
      <div className={style.description}>Functions</div>
      {specs?.map((nodeSpec: any, i: number) => (
        <div
          className={`${style.node} ${style[nodeSpec.type] || ""}`}
          onDragStart={(event) => onDragStart(event, nodeSpec)}
          draggable
          key={i}
        >
          {nodeSpec.description && (
            <div onDragStart={(e) => e.preventDefault()}>
              <div className={style.iconBox}>
                <img className={style.icon} src={question} alt="question" />
              </div>
              <div className={style.hint}>
                <pre>
                  <code>{nodeSpec.description}</code>
                </pre>
              </div>
            </div>
          )}

          {nodeSpec.label}
        </div>
      ))}
    </SidebarLayout>
  );
};
