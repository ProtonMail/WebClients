import { c } from 'ttag';

import { api } from '@proton/pass/lib/api/api';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import type { ShareType } from '@proton/pass/types';
import {
    type ActiveShareGetResponse,
    type ShareGetResponse,
    type ShareKeyResponse,
    type ShareRole,
} from '@proton/pass/types';
import type { ShareEditMemberAccessIntent, ShareRemoveMemberAccessIntent } from '@proton/pass/types/data/access.dto';
import { type ShareMember } from '@proton/pass/types/data/invites';
import { logId, logger } from '@proton/pass/utils/logger';

/* ⚠️ This endpoint is not paginated yet back-end side. */
export const getAllShareKeys = async (shareId: string): Promise<ShareKeyResponse[]> => {
    const response = await api({
        url: `pass/v1/share/${shareId}/key`,
        params: { Page: 0 },
        method: 'get',
    });

    return response.ShareKeys?.Keys ?? [];
};

export const getShareLatestEventId = async (shareId: string): Promise<string> =>
    api({
        url: `pass/v1/share/${shareId}/event`,
        method: 'get',
    })
        .then(({ EventID }) => EventID!)
        .catch(() => {
            logger.info(`[Share] Failed getting latest eventID for share ${logId(shareId)}`);
            return '';
        });

export const requestShares = async (): Promise<ShareGetResponse[]> =>
    (
        await api({
            url: 'pass/v1/share',
            method: 'get',
        })
    ).Shares;

export const requestShare = async (shareId: string, EventToken?: string) =>
    (await api({ url: `pass/v1/share/${shareId}`, method: 'get', params: { EventToken } })).Share;

export const deleteShare = async (shareId: string) => api({ url: `pass/v1/share/${shareId}`, method: 'delete' });

const mapShareMembers = (response: ActiveShareGetResponse[]) =>
    response.map((member) => ({
        shareId: member.ShareID,
        name: member.UserName,
        email: member.UserEmail,
        owner: member.Owner,
        targetType: member.TargetType,
        targetId: member.TargetID,
        shareRoleId: member.ShareRoleID as ShareRole,
        expireTime: member.ExpireTime,
        createTime: member.CreateTime,
    }));

export const loadShareItemMembers = async (shareId: string, itemId: string): Promise<ShareMember[]> =>
    api({ url: `pass/v1/share/${shareId}/user/item/${itemId}`, method: 'get' }).then((r) => mapShareMembers(r.Shares));

export const loadShareMembers = async (shareId: string): Promise<ShareMember[]> =>
    api({ url: `pass/v1/share/${shareId}/user`, method: 'get' }).then((r) => mapShareMembers(r.Shares));

export const removeUserAccess = async ({ shareId, userShareId }: ShareRemoveMemberAccessIntent) =>
    api({
        url: `pass/v1/share/${shareId}/user/${userShareId}`,
        method: 'delete',
    });

export const editMemberAccess = async ({ shareId, userShareId, shareRoleId }: ShareEditMemberAccessIntent) =>
    api({
        url: `pass/v1/share/${shareId}/user/${userShareId}`,
        method: 'put',
        data: { ShareRoleID: shareRoleId, ExpireTime: null },
    });

export const toggleVisibility = async (shareId: string, visible: boolean) => {
    const encryptedShare = (
        await api({
            url: `pass/v1/share/${shareId}/${visible ? 'unhide' : 'hide'}`,
            method: 'put',
        })
    ).Share;

    const shareKeys = await getAllShareKeys(shareId);
    const share = await parseShareResponse<ShareType.Vault>(encryptedShare, { shareKeys });

    if (!share) throw new Error(c('Error').t`Could not open updated vault`);

    return share;
};
