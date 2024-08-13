import { type WasmAccount, WasmApiBitcoinAddressesCreationPayload } from '@proton/andromeda';
import { type DecryptedAddressKey } from '@proton/shared/lib/interfaces';

import { signData } from './crypto';

export const computeAddress = async (
    wasmAccount: WasmAccount,
    walletAccountAddressKey: DecryptedAddressKey,
    bitcoinAddressIndex?: number | null
) => {
    const { address, index } = bitcoinAddressIndex
        ? await wasmAccount.peekReceiveAddress(bitcoinAddressIndex)
        : await wasmAccount.getNextReceiveAddress();

    const signature = await signData(address, 'wallet.bitcoin-address', [walletAccountAddressKey.privateKey]);

    return {
        BitcoinAddressIndex: index,
        BitcoinAddress: address,
        BitcoinAddressSignature: signature,
    };
};

export const generateBitcoinAddressesPayloadToFillPool = async ({
    addressesToCreate,
    wasmAccount,
    walletAccountAddressKey,
}: {
    addressesToCreate: number;
    wasmAccount: WasmAccount;
    walletAccountAddressKey: DecryptedAddressKey;
}) => {
    if (addressesToCreate > 0) {
        const payload = new WasmApiBitcoinAddressesCreationPayload();

        for (let i = 1; i <= addressesToCreate; i++) {
            try {
                const addressData = await computeAddress(wasmAccount, walletAccountAddressKey);
                payload.push(addressData);
            } catch (e) {
                console.error('Could not create bitcoin address creation payload', e);
            }
        }

        return payload;
    }
};
