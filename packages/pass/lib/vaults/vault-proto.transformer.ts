import type { ShareContent, ShareType } from '@proton/pass/types';
import { Vault } from '@proton/pass/types';

export const encodeVaultContent = (content: ShareContent<ShareType.Vault>): Uint8Array<ArrayBuffer> => {
    const creation = Vault.create({
        name: content.name,
        description: content.description,
        display: {
            color: content.display?.color,
            icon: content.display?.icon,
        },
    });

    return Vault.toBinary(creation);
};

export const decodeVaultContent = (content: Uint8Array<ArrayBuffer>): ShareContent<ShareType.Vault> => {
    const decoded = Vault.fromBinary(content);
    return {
        name: decoded.name,
        description: decoded.description,
        display: {
            color: decoded.display?.color,
            icon: decoded.display?.icon,
        },
    };
};
