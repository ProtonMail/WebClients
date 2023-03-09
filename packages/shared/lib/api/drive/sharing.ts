import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';

import { SORT_DIRECTION } from '../../constants';
import { DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER, FOLDER_PAGE_SIZE } from '../../drive/constants';
import { AbuseReportPayload, CreateSharedURL, UpdateSharedURL } from '../../interfaces/drive/sharing';

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

export const querySharedURLChildren = (
    token: string,
    linkId: string,
    {
        Page,
        PageSize = FOLDER_PAGE_SIZE,
        Sort = DEFAULT_SORT_FIELD,
        Desc = DEFAULT_SORT_ORDER === SORT_DIRECTION.ASC ? 0 : 1,
    }: { Page: number; PageSize?: number; FoldersOnly?: number; Sort?: string; Desc?: 0 | 1 }
) => {
    return {
        method: 'get',
        url: `drive/urls/${token}/folders/${linkId}/children`,
        params: { Page, PageSize, Sort, Desc, Thumbnails: 1 },
        silence: [HTTP_ERROR_CODES.UNAUTHORIZED],
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

export const queryUpdateSharedLink = (shareId: string, shareUrlId: string, data: Partial<UpdateSharedURL>) => {
    return {
        method: 'put',
        url: `drive/shares/${shareId}/urls/${shareUrlId}`,
        data,
    };
};

export const queryDeleteSharedLink = (shareId: string, shareUrlId: string) => {
    return {
        method: 'delete',
        url: `drive/shares/${shareId}/urls/${shareUrlId}`,
    };
};

export const queryDeleteMultipleSharedLinks = (shareId: string, shareUrlIds: string[]) => {
    return {
        method: 'post',
        url: `drive/shares/${shareId}/urls/delete_multiple`,
        data: {
            ShareURLIDs: shareUrlIds,
        },
    };
};

export const querySubmitAbuseReport = (data: AbuseReportPayload) => {
    return {
        method: 'post',
        url: 'drive/report/url',
        data,
    };
};
