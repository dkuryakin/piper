export interface IOutputInput {
    name: string;
    handleId: string;
}

export interface IExtraOutput {
    name: string;
    handleId: string;
    indexes?: {
        [key: string]: number;
    };
    spec: any;
}

export const enum ArrowPosition {
    Left = 'left',
    Right = 'right',
    Top = 'top',
    Bottom = 'bottom',
}
