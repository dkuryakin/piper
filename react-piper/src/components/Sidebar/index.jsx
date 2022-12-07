import React from 'react';
import {specToNodes, specToOptions} from "../../utils/spec";

const spec = [
    {'func': 'read_image', 'input': {'filename': {'type': 'string'}, 'data': {'type': 'bytes'}}, 'output': {'type': 'array', 'value_type': {'type': 'tensor'}}},
    {'func': 'find_documents', 'input': {'image': {'type': 'tensor'}}, 'output': {'type': 'array', 'value_type': {'type': 'object', 'value_type': {'image': {'type': 'tensor'}, 'coords': {'type': 'array', 'value_type': {'type': 'tuple', 'value_type': [{'type': 'integer'}, {'type': 'integer'}]}}}}}},
    {'func': 'enrich_list', 'input': {'items': {'type': 'array', 'value_type': {'type': 'any'}}}, 'output': {'type': 'array', 'value_type': {'type': 'dict', 'key_type': {'type': 'string'}, 'value_type': {'type': 'any'}}}},
    {'func': 'classify_document', 'input': {'image': {'type': 'tensor'}, 'coords': {'type': 'array', 'value_type': {'type': 'tuple', 'value_type': [{'type': 'integer'}, {'type': 'integer'}]}}}, 'output': {'type': 'object', 'value_type': {'image': {'type': 'tensor'}, 'type': {'type': 'string'}, 'rotation': {'type': 'integer'}, 'coords': {'type': 'array', 'value_type': {'type': 'tuple', 'value_type': [{'type': 'integer'}, {'type': 'integer'}]}}, 'confidence': {'type': 'float'}}}},
    {'func': 'find_fields', 'input': {'image': {'type': 'tensor'}, 'document_type': {'type': 'string'}, 'coords': {'type': 'union', 'value_type': [{'type': 'array', 'value_type': {'type': 'tuple', 'value_type': [{'type': 'integer'}, {'type': 'integer'}]}}, {'type': 'none'}]}}, 'output': {'type': 'array', 'value_type': {'type': 'object', 'value_type': {'name': {'type': 'string'}, 'crops': {'type': 'array', 'value_type': {'type': 'object', 'value_type': {'image': {'type': 'tensor'}, 'coords': {'type': 'array', 'value_type': {'type': 'tuple', 'value_type': [{'type': 'integer'}, {'type': 'integer'}]}}}}}, 'whole_crops': {'type': 'array', 'value_type': {'type': 'object', 'value_type': {'image': {'type': 'tensor'}, 'coords': {'type': 'array', 'value_type': {'type': 'tuple', 'value_type': [{'type': 'integer'}, {'type': 'integer'}]}}}}}}}}},
    {'func': 'ocr', 'input': {'image': {'type': 'tensor'}, 'document_type': {'type': 'string'}, 'field_name': {'type': 'string'}}, 'output': {'type': 'object', 'value_type': {'text': {'type': 'string'}, 'confidence': {'type': 'float'}}}},
    {'func': 'ocr_many', 'input': {'images': {'type': 'array', 'value_type': {'type': 'tensor'}}, 'document_type': {'type': 'string'}, 'field_name': {'type': 'string'}}, 'output': {'type': 'object', 'value_type': {'text': {'type': 'string'}, 'confidence': {'type': 'float'}}}},
]
const nodeSpecs = [
    {
        label: 'Input',
        type: 'input',
        input: [],
    },
    {
        label: 'Output',
        type: 'output',
        output: [],
    },
    {
        label: 'Map',
        type: 'group',
        func: 'map',
        width: 203,
        height: 123,
    },
    ...specToNodes(spec),
]
const Sidebar = () => {
    const onDragStart = (event, nodeSpec) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeSpec));
        event.dataTransfer.effectAllowed = 'move';
    };
    return (
      <aside>
          <div className="description">Functions</div>
          {nodeSpecs.map((nodeSpec, i) => (
            <div
              className={`dndnode ${nodeSpec.type}`}
              onDragStart={(event) => onDragStart(event, nodeSpec)}
              draggable
              key={i}
            >
                {nodeSpec.label}
            </div>
          ))}
      </aside>
    );
};
export default Sidebar;