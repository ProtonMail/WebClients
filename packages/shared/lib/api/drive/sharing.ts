import { HTTP_ERROR_CODES } from '../../errors';

export const queryInitSRPHandshake = (token: string) => {
    return {
        method: 'get',
        url: `drive/urls/${token}/info`,
        silence: true,
    };
};

export const querySharedURLInformation = (token: string) => {
    return {
        method: 'get',
        url: `drive/urls/${token}`,
        silence: true,
    };
};

export const querySharedURLPath = (token: string, linkID: string) => {
    return {
        method: 'get',
        url: `drive/urls/${token}/links/${linkID}/path`,
        silence: true,
    };
};

export const querySharedURLMetadata = (token: string, LinkIDs: string[]) => {
    return {
        method: 'post',
        url: `drive/urls/${token}/links/fetch_metadata`,
        silence: true,
        data: {
            LinkIDs,
        },
    };
};

export const querySharedURLSecurity = (token: string, Hashes: string[]) => {
    return {
        method: 'post',
        url: `drive/urls/${token}/security`,
        silence: true,
        data: {
            Hashes,
        },
    };
};

export const queryShareURLAuth = (token: string) => {
    return {
        method: 'post',
        url: `drive/urls/${token}/auth`,
        silence: true,
    };
};

export const querySharedURLFileRevision = (
    token: string,
    linkID: string,
    pagination?: {
        FromBlockIndex: number;
        PageSize: number;
    }
) => {
    const query = {
        method: 'get',
        url: `drive/urls/${token}/files/${linkID}`,
    };
    if (pagination) {
        return {
            ...query,
            params: pagination,
            silence: [HTTP_ERROR_CODES.UNAUTHORIZED],
        };
    }
    return query;
};

export const querySharedWithMeLinks = (params?: { AnchorID?: string }) => {
    return {
        method: 'get',
        url: 'drive/v2/sharedwithme',
        params,
    };
};

export const querySharedByMeLinks = (volumeId: string, params?: { AnchorID?: string }) => {
    return {
        method: 'get',
        url: `drive/v2/volumes/${volumeId}/shares`,
        params,
    };
};
