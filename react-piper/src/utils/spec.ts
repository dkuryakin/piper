import {Connection, Node} from 'reactflow';
import {IOutputInput} from '../types';

export const specToNodes = (spec: any) => spec.map((func: any) => ({
    ...func,
    type: 'default',
    label: ('_' + func.func).replaceAll(/_./g, s => ' ' + s.charAt(1).toUpperCase()).trim(),
    extra_output: [],
}));

const _objectSpecToOptions = (spec: any, prefix: string) => {
    let options = {};
    for (let option in spec) if (spec.hasOwnProperty(option)) {
        options = {
            ...options,
            ..._specToOptions(spec[option], `${prefix}${option}`),
        }
    }
    return options;
}


const _specToOptions = (spec: any, prefix: string) => {
    let inner_options = {};
    if (typeof spec === 'object' && !spec.hasOwnProperty('type')) {
        inner_options = _objectSpecToOptions(spec, prefix);
    }
    if (typeof spec === 'object' && spec.hasOwnProperty('type')) {
        if (spec.type === 'object') {
            inner_options = _objectSpecToOptions(spec.value_type, `${prefix}.`);
        }
        if (spec.type === 'array') {
            inner_options = _specToOptions(spec.value_type, `${prefix}[i]`);
        }
    }
    return {
        [prefix]: spec,
        ...inner_options,
    };
}


interface IResult {
    [key: string]: any;
}
export const specToOptions = (spec: any) => {
    const result: IResult = _specToOptions(spec, '');
    delete result[''];
    return result;
}

const _objectSpecToStr = (spec: any) => {
    const fields: string = Object.keys(spec).map(key => `${key}: ${specToStr(spec[key])}`).join(', ');
    return `object{${fields}}`;
}

export const specToStr = (spec: any): string => {
    if (typeof spec === 'object' && !spec.hasOwnProperty('type')) {
        return _objectSpecToStr(spec)
    }
    if (typeof spec === 'object' && spec.hasOwnProperty('type')) {
        if (spec.type === 'object') {
            return _objectSpecToStr(spec.value_type)
        }
        if (spec.type === 'array') {
            return 'array[' + specToStr(spec.value_type) + ']';
        }
        if (spec.type === 'tuple') {
            return 'tuple[' + spec.value_type.map((s: any) => specToStr(s)).join(', ') + ']';
        }
        if (spec.type === 'union') {
            return 'union[' + spec.value_type.map((s: any) => specToStr(s)).join(', ') + ']';
        }
        return spec.type;
    }
    return '?';
}

export const isValidConnection = (connection: Connection, nodes: Node[]) => {
    const source = nodes.filter(node => node.id === connection.source)[0];
    const target = nodes.filter(node => node.id === connection.target)[0];

    let source_spec;
    source_spec = source.data.extra_output.filter(({handleId}: IOutputInput) => handleId === connection.sourceHandle);
    if (source_spec.length === 0) {
        source_spec = source.data.output;
    } else {
        source_spec = source_spec[0].spec
    }

    const input_name = connection.targetHandle?.replace(/.*\./, '');
    let target_spec;
    if (input_name) {
        target_spec = target.type === 'output' ? {'type': 'any'} : target.data.input[input_name];
    }
    // console.log(source_spec, target_spec);
    // console.log(connection)

    if (target.data.type === 'map_input') {
        return source_spec && source_spec.type === 'array';
    }

    return validateSpecs(source_spec, target_spec);
};

export const validateSpecs = (src: any, dst: any) => {
    let srcs;
    let dsts;

    console.log(src, dst)

    if (typeof src === 'string' && typeof dst === "string") {
        return src === dst || src === 'any' || dst === 'any';
    }

    if (typeof src === 'string') {
        srcs = [src];
    } else if (src && src.type === 'union') {
        srcs = src.value_type;
    } else {
        srcs = [specToStr(src)]
    }

    if (typeof dst === 'string') {
        dsts = [dst];
    } else if (dst && dst.type === 'union') {
        dsts = dst.value_type;
    } else {
        dsts = [specToStr(dst)]
    }

    for (let s of srcs) {
        for (let d of dsts) {
            if (validateSpecs(s, d)) {
                return true;
            }
        }
    }
    return false;
}