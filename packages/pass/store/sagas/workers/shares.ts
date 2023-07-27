import { api } from '@proton/pass/api';
import { PassCrypto } from '@proton/pass/crypto';
import { type Maybe, type Share, type ShareGetResponse, ShareType } from '@proton/pass/types';
import { decodeVaultContent } from '@proton/pass/utils/protobuf';

import { getAllShareKeys } from './vaults';

export const getShareLatestEventId = async (shareId: string): Promise<string> =>
    api({
        url: `pass/v1/share/${shareId}/event`,
        method: 'get',
    })
        .then(({ EventID }) => EventID!)
        .catch(() => '');

const loadVaultShareById = async (shareId: string): Promise<Maybe<Share<ShareType.Vault>>> => {
    const [shareInfo, shareKeys, eventId] = await Promise.all([
        api({ url: `pass/v1/share/${shareId}`, method: 'get' }),
        getAllShareKeys(shareId),
        getShareLatestEventId(shareId),
    ]);

    const share = await PassCrypto.openShare<ShareType.Vault>({
        encryptedShare: shareInfo.Share!,
        shareKeys,
    });

    if (share) {
        return {
            shareId: share.shareId,
            targetId: share.targetId,
            targetType: share.targetType,
            vaultId: share.vaultId,
            eventId,
            content: decodeVaultContent(share.content),
            primary: Boolean(shareInfo.Share?.Primary),
        };
    }
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
