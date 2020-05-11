import { CreateDriveFile, UpdateFileRevision } from '../interfaces/file';

export const queryCreateFile = (shareId: string, data: CreateDriveFile) => {
    return {
        method: 'post',
        url: `drive/shares/${shareId}/files`,
        data
    };
};

export const queryFileRevision = (shareId: string, linkId: string, revisionId: number) => {
    return {
        method: 'get',
        url: `drive/shares/${shareId}/files/${linkId}/revisions/${revisionId}`
    };
};

export const queryRequestUpload = (data: {
    BlockList: { Hash: string; Size: number; Index: number }[];
    AddressID: string;
    Signature: string;
    ShareID: string;
    LinkID: string;
    RevisionID: string;
}) => {
    return {
        method: 'post',
        url: 'drive/blocks',
        data: { ...data, V2: true }
    };
};

export const queryFileBlock = (url: string) => {
    return {
        method: 'get',
        output: 'stream',
        url
    };
};

export const queryUploadFileBlock = (url: string, chunk: Uint8Array) => {
    return {
        method: 'put',
        input: 'binary',
        data: new Blob([chunk]),
        url
    };
};

export const queryUpdateFileRevision = (
    shareID: string,
    linkID: string,
    revisionID: string,
    data: UpdateFileRevision
) => {
    return {
        method: 'put',
        url: `drive/shares/${shareID}/files/${linkID}/revisions/${revisionID}`,
        data
    };
};
