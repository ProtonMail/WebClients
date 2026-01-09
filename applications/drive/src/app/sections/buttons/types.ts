type ActionButtonType = 'toolbar' | 'context';

type BaseProps = {
    type: ActionButtonType;
    title?: string;
    onClick: () => void;
};

type ToolbarActionButtonTypeProps = BaseProps & {
    type: 'toolbar';
    close?: never;
};

type ContextActionButtonProps = BaseProps & {
    type: 'context';
    close: () => void;
};

export type ActionButtonProps = ToolbarActionButtonTypeProps | ContextActionButtonProps;
