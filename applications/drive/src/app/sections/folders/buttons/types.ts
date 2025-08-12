type FolderButtonType = 'toolbar' | 'context';

type BaseProps = {
    type: FolderButtonType;
    onClick: () => void;
};

type FolderToolbarButtonProps = BaseProps & {
    type: 'toolbar';
    close?: never;
};

type FolderContextButtonProps = BaseProps & {
    type: 'context';
    close: () => void;
};

export type FolderButtonProps = FolderToolbarButtonProps | FolderContextButtonProps;
