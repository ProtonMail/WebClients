import { CreateSharedURL, UpdateSharedURL } from '../interfaces/sharing';

export const queryInitSRPHandshake = (token: string) => {
    return {
        method: 'get',
        url: `drive/urls/${token}/info`,
        silence: true,
    };
};

export const queryGetSharedLinkPayload = (token: string) => {
    return {
        method: 'post',
        url: `drive/urls/${token}/file`,
        silence: true,
    };
};

export const queryCreateSharedLink = (shareId: string, data: CreateSharedURL) => {
    return {
        method: 'post',
        url: `drive/shares/${shareId}/urls`,
        data,
    };
};

export const querySharedLinks = (shareId: string) => {
    return {
        method: 'get',
        url: `drive/shares/${shareId}/urls`,
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
