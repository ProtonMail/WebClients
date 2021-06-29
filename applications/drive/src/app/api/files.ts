import { CreateDriveFile, UpdateFileRevision } from '../interfaces/file';
import { UPLOAD_TIMEOUT } from '../constants';

export const queryCreateFile = (shareId: string, data: CreateDriveFile) => {
    return {
        method: 'post',
        timeout: UPLOAD_TIMEOUT,
        url: `drive/shares/${shareId}/files`,
        silence: true,
        data,
    };
};

export const queryFileRevision = (
    shareId: string,
    linkId: string,
    revisionId: string,
    pagination?: { FromBlockIndex: number; PageSize: number }
) => {
    const query = {
        method: 'get',
        url: `drive/shares/${shareId}/files/${linkId}/revisions/${revisionId}`,
        silence: true,
    };

    if (pagination) {
        return {
            ...query,
            params: pagination,
        };
    }

    return query;
};

export const queryFileRevisionThumbnail = (shareId: string, linkId: string, revisionId: string) => {
    return {
        method: 'get',
        url: `drive/shares/${shareId}/files/${linkId}/revisions/${revisionId}/thumbnail`,
        silence: true,
    };
};

export const queryRequestUpload = (data: {
    BlockList: { Hash: string; EncSignature: string; Size: number; Index: number }[];
    AddressID: string;
    ShareID: string;
    LinkID: string;
    RevisionID: string;
    Thumbnail?: number;
    ThumbnailHash?: string;
    ThumbnailSize?: number;
}) => {
    return {
        method: 'post',
        url: 'drive/blocks',
        data,
    };
};

export const queryFileBlock = (url: string) => {
    return {
        method: 'get',
        output: 'stream',
        credentials: 'omit',
        url,
    };
};

export const queryUploadFileBlock = (url: string, chunk: Uint8Array) => {
    return {
        method: 'put',
        input: 'binary',
        data: new Blob([chunk]),
        url,
    };
};

export const queryCreateFileRevision = (shareId: string, linkId: string, currentRevisiontID: string) => {
    return {
        method: 'post',
        timeout: UPLOAD_TIMEOUT,
        url: `drive/shares/${shareId}/files/${linkId}/revisions`,
        silence: true,
        data: {
            CurrentRevisionID: currentRevisiontID,
        },
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
        data,
    };
};

export const queryDeleteFileRevision = (shareId: string, linkId: string, revisiontID: string) => {
    return {
        method: 'delete',
        url: `drive/shares/${shareId}/files/${linkId}/revisions/${revisiontID}`,
    };
};
