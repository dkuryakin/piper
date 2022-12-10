import React, { DragEvent, FC, useEffect, useState } from 'react';
import { specToNodes } from '../../../utils/spec';
import style from './Sidebar.module.css';
import arrowLeft from '../../../shared/assets/images/arrow-left.svg';

const specMock = [
    {
        func: 'read_image',
        input: { filename: { type: 'string' }, data: { type: 'bytes' } },
        output: { type: 'array', value_type: { type: 'tensor' } },
    },
    {
        func: 'find_documents',
        input: { image: { type: 'tensor' } },
        output: {
            type: 'array',
            value_type: {
                type: 'object',
                value_type: {
                    image: { type: 'tensor' },
                    coords: {
                        type: 'array',
                        value_type: {
                            type: 'tuple',
                            value_type: [{ type: 'integer' }, { type: 'integer' }],
                        },
                    },
                },
            },
        },
    },
    {
        func: 'enrich_list',
        input: { items: { type: 'array', value_type: { type: 'any' } } },
        output: {
            type: 'array',
            value_type: { type: 'dict', key_type: { type: 'string' }, value_type: { type: 'any' } },
        },
    },
    {
        func: 'classify_document',
        input: {
            image: { type: 'tensor' },
            coords: {
                type: 'array',
                value_type: {
                    type: 'tuple',
                    value_type: [{ type: 'integer' }, { type: 'integer' }],
                },
            },
        },
        output: {
            type: 'object',
            value_type: {
                image: { type: 'tensor' },
                type: { type: 'string' },
                rotation: { type: 'integer' },
                coords: {
                    type: 'array',
                    value_type: {
                        type: 'tuple',
                        value_type: [{ type: 'integer' }, { type: 'integer' }],
                    },
                },
                confidence: { type: 'float' },
            },
        },
    },
    {
        func: 'find_fields',
        input: {
            image: { type: 'tensor' },
            document_type: { type: 'string' },
            coords: {
                type: 'union',
                value_type: [
                    {
                        type: 'array',
                        value_type: {
                            type: 'tuple',
                            value_type: [{ type: 'integer' }, { type: 'integer' }],
                        },
                    },
                    { type: 'none' },
                ],
            },
        },
        output: {
            type: 'array',
            value_type: {
                type: 'object',
                value_type: {
                    name: { type: 'string' },
                    crops: {
                        type: 'array',
                        value_type: {
                            type: 'object',
                            value_type: {
                                image: { type: 'tensor' },
                                coords: {
                                    type: 'array',
                                    value_type: {
                                        type: 'tuple',
                                        value_type: [{ type: 'integer' }, { type: 'integer' }],
                                    },
                                },
                            },
                        },
                    },
                    whole_crops: {
                        type: 'array',
                        value_type: {
                            type: 'object',
                            value_type: {
                                image: { type: 'tensor' },
                                coords: {
                                    type: 'array',
                                    value_type: {
                                        type: 'tuple',
                                        value_type: [{ type: 'integer' }, { type: 'integer' }],
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    {
        func: 'ocr',
        input: {
            image: { type: 'tensor' },
            document_type: { type: 'string' },
            field_name: { type: 'string' },
        },
        output: {
            type: 'object',
            value_type: { text: { type: 'string' }, confidence: { type: 'float' } },
        },
    },
    {
        func: 'ocr_many',
        input: {
            images: { type: 'array', value_type: { type: 'tensor' } },
            document_type: { type: 'string' },
            field_name: { type: 'string' },
        },
        output: {
            type: 'object',
            value_type: { text: { type: 'string' }, confidence: { type: 'float' } },
        },
    },
];

const nodeSpec = [
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
        zIndex: -1,
    },
];

interface SidebarProps {
    specs_url: string;
}

export const Sidebar: FC<SidebarProps> = ({ specs_url }) => {
    const [specs, setSpecs] = useState<any>(null);
    const [collapsed, setCollapsed] = useState<boolean>(false);

    const onClickHandler = () => {
        setCollapsed(!collapsed);
    };
    const onDragStart = (event: DragEvent<HTMLDivElement>, nodeSpec: any) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeSpec));
        event.dataTransfer.effectAllowed = 'move';
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
        <aside className={`${style.sidebar} ${collapsed ? style.collapsed : ''}`}>
            <button className={style.button} onClick={onClickHandler}>
                <img className={style.icon} src={arrowLeft} alt="Arrow left" />
            </button>
            <div className={style.inner}>
                <div className={style.description}>Functions</div>
                {specs === null
                    ? ''
                    : specs.map((nodeSpec: any, i: number) => (
                          <div
                              className={`dndnode ${nodeSpec.type}`}
                              onDragStart={(event) => onDragStart(event, nodeSpec)}
                              draggable
                              key={i}
                          >
                              {nodeSpec.label}
                          </div>
                      ))}
            </div>
        </aside>
    );
};
