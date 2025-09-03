import { c } from 'ttag';

import { api } from '@proton/pass/lib/api/api';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import { encodeVaultContent } from '@proton/pass/lib/vaults/vault-proto.transformer';
import type { Share, ShareContent, ShareType, VaultCreateRequest, VaultTransferOwnerIntent } from '@proton/pass/types';

export const createVault = async (data: {
    content: ShareContent<ShareType.Vault>;
}): Promise<Share<ShareType.Vault>> => {
    const encoded = encodeVaultContent(data.content);
    const encryptedVault: VaultCreateRequest = { ...(await PassCrypto.createVault(encoded)) };

    const encryptedShare = (
        await api({
            url: 'pass/v1/vault',
            method: 'post',
            data: encryptedVault,
        })
    ).Share!;

    const share = await parseShareResponse<ShareType.Vault>(encryptedShare);
    if (!share) throw new Error(c('Error').t`Could not open created vault`);

    return share;
};

/** Pass `eventId` to avoid redundant API call for latest share
 * event ID in `parseShareResponse` since we already know it. */
export const editVault = async (
    shareId: string,
    content: ShareContent<ShareType.Vault>,
    eventId: string
): Promise<Share<ShareType.Vault>> => {
    const encoded = encodeVaultContent(content);
    const encryptedVaultUpdate = await PassCrypto.updateVault({ shareId, content: encoded });

    const encryptedShare = (
        await api({
            url: `pass/v1/vault/${shareId}`,
            method: 'put',
            data: encryptedVaultUpdate,
        })
    ).Share!;

    const share = await parseShareResponse<ShareType.Vault>(encryptedShare, { eventId });
    if (!share) throw new Error(c('Error').t`Could not open updated vault`);

    return share;
};

export const deleteVault = async (shareId: string) => api({ url: `pass/v1/vault/${shareId}`, method: 'delete' });

export const vaultTransferOwner = async ({ shareId, userShareId }: VaultTransferOwnerIntent) =>
    api({
        url: `pass/v1/vault/${shareId}/owner`,
        method: 'put',
        data: { NewOwnerShareID: userShareId },
    });
