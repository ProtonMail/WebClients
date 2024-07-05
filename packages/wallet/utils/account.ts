import { WasmAccount, WasmApiBitcoinAddressesCreationPayload } from '@proton/andromeda';
import { DecryptedKey } from '@proton/shared/lib/interfaces';

import { signData } from './crypto';

export const generateBitcoinAddressesPayloadForPoolFilling = async ({
    addressesToCreate,
    startIndex,
    wasmAccount,
    addressKey,
}: {
    addressesToCreate: number;
    startIndex: number;
    wasmAccount: WasmAccount;
    addressKey: DecryptedKey;
}) => {
    let nextIndexToUse = startIndex;

    const computeAddressDataFromIndex = async (index: number) => {
        const { address } = await wasmAccount.getAddress(index);
        const signature = await signData(address, 'wallet.bitcoin-address', [addressKey.privateKey]);

        return {
            BitcoinAddressIndex: index,
            BitcoinAddress: address,
            BitcoinAddressSignature: signature,
        };
    };

    if (addressesToCreate > 0) {
        const payload = new WasmApiBitcoinAddressesCreationPayload();

        for (let i = 1; i <= addressesToCreate; i++) {
            try {
                const addressData = await computeAddressDataFromIndex(nextIndexToUse);
                payload.push(addressData);
                nextIndexToUse = nextIndexToUse + 1;
            } catch (e) {
                console.error('Could not create bitcoin address creation payload', e);
            }
        }

        return payload;
    }
};
