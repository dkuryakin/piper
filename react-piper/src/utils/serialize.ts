import {Edge, Node} from 'reactflow';
import {IOutputInput} from '../types';

const getPairNodeByHandle = (nodes: Node[], edges: Edge[], handleId: string) => {
    const _edges = edges.filter(edge => edge.targetHandle === handleId || edge.sourceHandle === handleId);
    if (_edges.length === 0) {
        return null;
    }
    const edge = _edges[0];
    let nodeId: string;
    if (edge.sourceHandle === handleId) {
        nodeId = edge.target;
    } else {
        nodeId = edge.source;
    }
    return nodes.filter(node => node.id === nodeId)[0];
}

const getPairEdgeByHandle = (nodes: Node[], edges: Edge[], handleId: string) => {
    const edge = edges.filter(edge => edge.targetHandle === handleId || edge.sourceHandle === handleId)[0];
    if (edge.sourceHandle === handleId) {
        return edge.targetHandle;
    }
    return edge.sourceHandle;
}

const getMapOutputNode = (nodes: Node[], edges: Edge[], input_node: Node) => {
    return nodes.filter(node => node.parentNode === input_node.parentNode && node.data.type === 'map_output')[0];
}

const genMapSpec = (nodes: Node[], edges: Edge[], input_node: Node, stages_ids: Set<string>) => {
    const output_node = getMapOutputNode(nodes, edges, input_node);
    return genPipelineSpec(nodes, edges, input_node, output_node, stages_ids);
}

const genStagesSpec = (nodes: Node[], edges: Edge[], node: Node, stages_ids: Set<string>) => {
    if (stages_ids.has(node.id)) {
        return [];
    }
    stages_ids.add(node.id);
    const {func, input, extra_output, type} = node.data;

    if (type === 'output' || type === 'map_output') {
        return [];
    }

    let input_spec: any = {};
    for (let key of Object.keys(input)) {
        const targetHandle = `func-node-${node.id}-input.${key}`;
        if (!node?.data?.params?.hasOwnProperty(key)) {
            input_spec[key] = genInputByHandle(nodes, edges, targetHandle);
        }
    }

    const outputHandles = [
        `func-node-${node.id}-output`,
        ...extra_output.map(({handleId}: IOutputInput) => handleId),
    ]

    let spec;
    if (node.data.type === 'map_input') {
        spec = {
            func: 'map',
            name: node.parentNode,
            input: {'items': input_spec['item']},
            params: genMapSpec(nodes, edges, node, stages_ids),
        }
        const output_node = getMapOutputNode(nodes, edges, node);
        outputHandles.push(`${output_node.id}-map-output`);
    } else {
        spec = {
            func,
            name: node.id,
            input: input_spec,
            params: node.data.params,
        }
    }

    let specs = [spec];
    for (let outputHandle of outputHandles) {
        // console.log(outputHandle)
        // console.log(edges)
        const targetNode = getPairNodeByHandle(nodes, edges, outputHandle);
        if (targetNode !== null) {
            specs = [...specs, ...genStagesSpec(nodes, edges, targetNode, stages_ids)];
        }
    }
    return specs;
}

const genInputByHandle = (nodes: Node[], edges: Edge[], targetHandle: string) => {
    const srcNode = getPairNodeByHandle(nodes, edges, targetHandle);

    if (srcNode?.data.type === 'map_output') {
        return srcNode.parentNode;
    }

    const sourceHandle = getPairEdgeByHandle(nodes, edges, targetHandle);
    let srcExtraOutput;

    if (srcNode?.data.type === 'default' || srcNode?.data.type === 'map_input') {
        srcExtraOutput = srcNode?.data.extra_output.filter(({handleId}: IOutputInput) => handleId === sourceHandle)
    } else if (srcNode?.data.type === 'input') {
        srcExtraOutput = srcNode?.data.input.filter(({handleId}: IOutputInput) => handleId === sourceHandle)
    } else {
        // console.log(srcNode)
        throw new Error('unable to serialize flow')
    }

    let path = (srcNode.data.type === 'input' || srcNode.data.type === 'map_input') ? 'input' : srcNode.id;
    if (srcExtraOutput.length !== 0) {
        const indexes = srcExtraOutput[0].indexes;
        let name = srcExtraOutput[0].name.replace(/\[i]/g, `.0`);
        if (indexes) {
            for (const index in indexes) {
                name = name.replace(/\.0/, `.${indexes[index]}`);
            }
        }
        path += (name.charAt(0) === '.' ? '' : '.') + name;
    }
    return path;
}

const genOutputSpec = (nodes: Node[], edges: Edge[], output_node: Node) => {
    if (output_node.data.output.length === 0) {
        const incoming_edges = edges.filter(edge => edge.target === output_node.id);
        return genInputByHandle(nodes, edges, incoming_edges[0].targetHandle || '');
    } else {
        const spec: any = {};
        for (let {name, handleId} of output_node.data.output) {
            spec[name] = genInputByHandle(nodes, edges, handleId);
        }
        return spec;
    }
}

const genPipelineSpec = (nodes: Node[], edges: Edge[], input_node: Node, output_node: Node, stages_ids: Set<string>) => {
    let stages_spec: any = [];

    let inputHandles;
    if (input_node.data.type === 'input') {
        inputHandles = input_node.data.input.map(({handleId}: IOutputInput) => handleId);
    } else {
        // map_input
        inputHandles = [
            `func-node-${input_node.id}-output`,
            ...input_node.data.extra_output.map(({handleId}: IOutputInput) => handleId),
        ];
    }

    for (let handleId of inputHandles) {
        const node = getPairNodeByHandle(nodes, edges, handleId);
        if (node !== null) {
            const _stages_spec = genStagesSpec(nodes, edges, node, stages_ids);
            stages_spec = [...stages_spec, ..._stages_spec];
        }
    }
    const output_spec = genOutputSpec(nodes, edges, output_node);
    if (input_node.data.type === 'input') {
        const input_spec = input_node.data.input.map(({name}: IOutputInput) => name);
        return {
            'input': input_spec,
            'stages': stages_spec,
            'output': output_spec,
        }
    }
    // map_input
    return {
        'stages': stages_spec,
        'output': output_spec,
    }
}


export const generateSpec = (nodes: Node[], edges: Edge[]) => {
    const input_node = nodes.filter(node => !node.parentNode && node.type === 'input')[0];
    const output_node = nodes.filter(node => !node.parentNode && node.type === 'output')[0];
    const stages_ids: Set<string> = new Set();
    const spec = genPipelineSpec(nodes, edges, input_node, output_node, stages_ids);
    // console.log(spec);
    // console.log(JSON.stringify(spec));
    return spec;
};