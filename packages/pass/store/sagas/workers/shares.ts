import { api } from '@proton/pass/api';
import { PassCrypto } from '@proton/pass/crypto';
import { type Maybe, type Share, type ShareGetResponse, type ShareRole, ShareType } from '@proton/pass/types';
import { type ShareMember } from '@proton/pass/types/data/invites';
import type { ShareEditMemberAccessIntent, ShareRemoveMemberAccessIntent } from '@proton/pass/types/data/shares.dto';
import { decodeVaultContent } from '@proton/pass/utils/protobuf';

import { getAllShareKeys } from './vaults';

export const getShareLatestEventId = async (shareId: string): Promise<string> =>
    api({
        url: `pass/v1/share/${shareId}/event`,
        method: 'get',
    })
        .then(({ EventID }) => EventID!)
        .catch(() => '');

export const decryptShareResponse = async (
    encryptedShare: ShareGetResponse
): Promise<Maybe<Share<ShareType.Vault>>> => {
    const shareId = encryptedShare.ShareID;
    const [shareKeys, eventId] = await Promise.all([getAllShareKeys(shareId), getShareLatestEventId(shareId)]);
    const share = await PassCrypto.openShare<ShareType.Vault>({ encryptedShare, shareKeys });

    if (share) {
        return {
            content: decodeVaultContent(share.content),
            createTime: share.createTime,
            eventId,
            owner: share.owner,
            primary: Boolean(encryptedShare.Primary),
            shared: share.shared,
            shareId: share.shareId,
            shareRoleId: share.shareRoleId,
            targetId: share.targetId,
            targetMembers: share.targetMembers,
            targetType: share.targetType,
            vaultId: share.vaultId,
        };
    }
};

const loadVaultShareById = async (shareId: string): Promise<Maybe<Share<ShareType.Vault>>> => {
    const encryptedShare = await api({ url: `pass/v1/share/${shareId}`, method: 'get' });
    return decryptShareResponse(encryptedShare.Share!);
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
