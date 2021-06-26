import { CreateSharedURL, UpdateSharedURL } from '../interfaces/sharing';

export const queryInitSRPHandshake = (token: string) => {
    return {
        method: 'get',
        url: `drive/urls/${token}/info`,
        silence: true,
    };
};

export const queryGetSharedLinkPayload = (
    token: string,
    pagination?: {
        FromBlockIndex: number;
        PageSize: number;
    }
) => {
    return {
        method: 'post',
        url: `drive/urls/${token}/file`,
        silence: true,
        data: pagination,
    };
};

export const queryCreateSharedLink = (shareId: string, data: CreateSharedURL) => {
    return {
        method: 'post',
        url: `drive/shares/${shareId}/urls`,
        data,
    };
};

export const querySharedLinks = (shareId: string, params: { Page: number; PageSize?: number; Recursive?: 1 | 0 }) => {
    return {
        method: 'get',
        url: `drive/shares/${shareId}/urls`,
        params,
    };
};

export const queryUpdateSharedLink = (shareId: string, token: string, data: Partial<UpdateSharedURL>) => {
    return {
        method: 'put',
        url: `drive/shares/${shareId}/urls/${token}`,
        data,
    };
};

export const queryDeleteSharedLink = (shareId: string, token: string) => {
    return {
        method: 'delete',
        url: `drive/shares/${shareId}/urls/${token}`,
    };
};

export const queryDeleteMultipleSharedLinks = (shareId: string, shareURLIds: string[]) => {
    return {
        method: 'post',
        url: `drive/shares/${shareId}/urls/delete_multiple`,
        data: {
            ShareURLIDs: shareURLIds,
        },
    };
};
