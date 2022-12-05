export const specToNodes = spec => spec.map(func => ({
    ...func,
    type: 'default',
    label: ('_' + func.func).replaceAll(/_./g, s => ' ' + s.charAt(1).toUpperCase()).trim(),
    extra_output: [],
}));

const _objectSpecToOptions = (spec, prefix) => {
    let options = [];
    for (let option in spec) if (spec.hasOwnProperty(option)) {
        options = [
            ...options,
            ..._specToOptions(spec[option], `${prefix}${option}`),
        ]
    }
    return options;
}


const _specToOptions = (spec, prefix) => {
    let inner_options = [];
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
    return [
        prefix,
        ...inner_options,
    ];
}

export const specToOptions = (spec) => {
    return _specToOptions(spec, '').filter(option => option.length);
}

const _objectSpecToStr = (spec) => {
    const fields = Object.keys(spec).map(key => `${key}: ${specToStr(spec[key])}`).join(', ');
    return `object{${fields}}`;
}

export const specToStr = (spec) => {
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
        return spec.type;
    }
    return '?';
}