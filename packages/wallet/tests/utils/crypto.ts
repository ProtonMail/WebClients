import { type DecryptedKey } from '@proton/shared/lib/interfaces';
import { verifySignedData } from '@proton/wallet';

export const expectSignedBy = async (k: DecryptedKey, a?: string, w?: string) => {
    expect(a).toBeTruthy();
    expect(w).toBeTruthy();

    const isVerified = await verifySignedData(a as string, w as string, 'wallet.bitcoin-address', [k.publicKey]);
    expect(isVerified).toBeTruthy();
};
