import { api } from '@proton/pass/lib/api/api';
import {
    type Maybe,
    type Share,
    type ShareGetResponse,
    type ShareKeyResponse,
    type ShareRole,
    ShareType,
} from '@proton/pass/types';
import { type ShareMember } from '@proton/pass/types/data/invites';
import type { ShareEditMemberAccessIntent, ShareRemoveMemberAccessIntent } from '@proton/pass/types/data/shares.dto';

import { parseShareResponse } from './share.utils';

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
        .catch(() => '');

const loadVaultShareById = async (shareId: string): Promise<Maybe<Share<ShareType.Vault>>> => {
    const encryptedShare = await api({ url: `pass/v1/share/${shareId}`, method: 'get' });
    return parseShareResponse(encryptedShare.Share!);
};

export const requestShares = async (): Promise<ShareGetResponse[]> =>
    (
        await api({
            url: 'pass/v1/share',
            method: 'get',
        })
    ).Shares;

export const loadShare = async <T extends ShareType>(shareId: string, targetType: T): Promise<Maybe<Share<T>>> => {
    switch (targetType) {
        case ShareType.Vault:
            return (await loadVaultShareById(shareId)) as Maybe<Share<T>>;
        default:
            throw new Error(`Unsupported share type ${ShareType[targetType]}`);
    }
};

export const deleteShare = async (shareId: string) => api({ url: `pass/v1/share/${shareId}`, method: 'delete' });

export const loadShareMembers = async (shareId: string): Promise<ShareMember[]> => {
    const { Shares: members } = await api({
        url: `pass/v1/share/${shareId}/user`,
        method: 'get',
    });

    return members.map((member) => ({
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
};

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
