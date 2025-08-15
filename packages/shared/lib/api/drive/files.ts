import { UPLOAD_TIMEOUT } from '../../drive/constants';
import type {
    CreateDriveFile,
    PublicCreateDriveFile,
    Thumbnail,
    UpdateFileRevision,
} from '../../interfaces/drive/file';

export const queryCreateFile = (shareId: string, data: CreateDriveFile) => {
    return {
        method: 'post',
        timeout: UPLOAD_TIMEOUT,
        url: `drive/shares/${shareId}/files`,
        silence: true,
        data,
    };
};

export const queryFileRevisions = (shareId: string, linkId: string) => {
    return {
        method: 'get',
        url: `drive/shares/${shareId}/files/${linkId}/revisions`,
        silence: true,
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

export const queryFileRevisionThumbnail = (
    shareId: string,
    linkId: string,
    revisionId: string,
    thumbnailType: 1 | 2 | 3 = 1
) => {
    return {
        method: 'get',
        url: `drive/shares/${shareId}/files/${linkId}/revisions/${revisionId}/thumbnail?Type=${thumbnailType}`,
        silence: true,
    };
};

/**
 * This route should never be called without also instanciating a verifier.
 * See the file uploader in the Drive app.
 */
export const queryVerificationData = (shareId: string, linkId: string, revisionId: string) => {
    return {
        method: 'get',
        url: `drive/shares/${shareId}/links/${linkId}/revisions/${revisionId}/verification`,
        silence: true,
    };
};

export const queryRequestUpload = (data: {
    BlockList: {
        Hash: string;
        EncSignature: string;
        Size: number;
        Index: number;
        Verifier: {
            Token: string;
        };
    }[];
    ThumbnailList?: Omit<Thumbnail, 'ThumbnailID'>[];
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

export const queryUploadFileBlock = (url: string, chunk: Uint8Array<ArrayBuffer>) => {
    return {
        method: 'put',
        input: 'binary',
        data: new Blob([chunk]),
        url,
    };
};

export const queryCreateFileRevision = (
    shareId: string,
    linkId: string,
    currentRevisionId: string,
    clientUID?: string
) => {
    return {
        method: 'post',
        timeout: UPLOAD_TIMEOUT,
        url: `drive/shares/${shareId}/files/${linkId}/revisions`,
        silence: true,
        data: {
            CurrentRevisionID: currentRevisionId,
            ClientUID: clientUID,
        },
    };
};

export const queryUpdateFileRevision = (
    shareID: string,
    linkID: string,
    revisionId: string,
    data: UpdateFileRevision
) => {
    return {
        method: 'put',
        timeout: UPLOAD_TIMEOUT,
        url: `drive/shares/${shareID}/files/${linkID}/revisions/${revisionId}`,
        data,
    };
};

export const queryDeleteFileRevision = (shareId: string, linkId: string, revisionId: string) => {
    return {
        method: 'delete',
        url: `drive/shares/${shareId}/files/${linkId}/revisions/${revisionId}`,
    };
};

export const queryRestoreFileRevision = (shareId: string, linkId: string, revisionId: string) => {
    return {
        method: 'post',
        url: `drive/shares/${shareId}/files/${linkId}/revisions/${revisionId}/restore`,
    };
};

/** Public **/
export const queryPublicCreateFile = (token: string, data: PublicCreateDriveFile) => {
    return {
        method: 'post',
        timeout: UPLOAD_TIMEOUT,
        url: `drive/urls/${token}/files`,
        silence: true,
        data,
    };
};

export const queryPublicRequestUpload = (
    token: string,
    data: {
        BlockList: {
            Hash: string;
            EncSignature?: string;
            Size: number;
            Index: number;
            Verifier: {
                Token: string;
            };
        }[];
        ThumbnailList?: Omit<Thumbnail, 'ThumbnailID'>[];
        SignatureEmail?: string;
        LinkID: string;
        RevisionID: string;
        Thumbnail?: number;
        ThumbnailHash?: string;
        ThumbnailSize?: number;
    }
) => {
    return {
        method: 'post',
        url: `drive/urls/${token}/blocks`,
        data,
    };
};

/**
 * This route should never be called without also instanciating a verifier.
 * See the file uploader in the Drive app.
 */
export const queryPublicVerificationData = (token: string, linkId: string, revisionId: string) => {
    return {
        method: 'get',
        url: `drive/urls/${token}/links/${linkId}/revisions/${revisionId}/verification`,
        silence: true,
    };
};

export const queryPublicUpdateFileRevision = (
    token: string,
    linkID: string,
    revisionId: string,
    data: Omit<UpdateFileRevision, 'SignatureAddress'> & {
        SignatureEmail?: string;
    }
) => {
    return {
        method: 'put',
        timeout: UPLOAD_TIMEOUT,
        url: `drive/urls/${token}/files/${linkID}/revisions/${revisionId}`,
        data,
    };
};
