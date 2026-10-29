import type { MaybeNull } from '../utils';

export type FolderData = {
    folderId: string;
    shareId: string;
    vaultId: string;
    parentFolderId: MaybeNull<string>;
    name: string;
    keyRotation: number;
};

export type FolderCreateDTO = {
    shareId: string;
    parentFolderId: MaybeNull<string>;
    name: string;
};

export type FolderEditDTO = {
    shareId: string;
    folderId: string;
    name: string;
};

export type FolderMoveDTO = {
    shareId: string;
    folderId: string;
    targetParentFolderId: MaybeNull<string>;
};

export type FolderDeleteDTO = {
    shareId: string;
    folderIds: string[];
};

export type FolderCreateSuccess = {
    shareId: string;
    folder: FolderData;
};

export type FolderEditSuccess = {
    shareId: string;
    folder: FolderData;
};

export type FolderMoveSuccess = {
    shareId: string;
    folder: FolderData;
};

export type FolderDeleteSuccess = {
    shareId: string;
    folderIds: string[];
};
