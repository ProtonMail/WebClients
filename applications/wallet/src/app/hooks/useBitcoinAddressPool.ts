import { useCallback, useState } from 'react';

import { WasmApiBitcoinAddressesCreationPayload } from '@proton/andromeda';
import { useUserKeys } from '@proton/components/hooks';
import { CryptoProxy } from '@proton/crypto/lib';
import { IWasmApiWalletData, useWalletApi } from '@proton/wallet';

import { POOL_FILLING_THRESHOLD } from '../constants/email-integration';
import { useGetBitcoinAddressHighestIndex } from '../store/hooks/useBitcoinAddressHighestIndex';
import { WalletWithChainData } from '../types';

export const useBitcoinAddressPool = ({
    decryptedApiWalletsData,
    walletsChainData,
}: {
    decryptedApiWalletsData?: IWasmApiWalletData[];
    walletsChainData: Partial<Record<string, WalletWithChainData>>;
}) => {
    const api = useWalletApi();

    const getBitcoinAddressHighestIndex = useGetBitcoinAddressHighestIndex();
    const [userKeys] = useUserKeys();
    const [isLoading, setIsLoading] = useState(false);

    const fillPool = useCallback(async () => {
        if (!userKeys?.length) {
            return;
        }

        setIsLoading(true);
        for (const decryptedWallet of decryptedApiWalletsData ?? []) {
            const walletId = decryptedWallet.Wallet.ID;

            const wallet = walletsChainData[walletId];

            // We cannot create address with the wasm wallet
            if (!wallet) {
                continue;
            }

            for (const walletAccount of decryptedWallet.WalletAccounts) {
                const walletAccountId = walletAccount.ID;
                const wasmAccount = wallet.accounts[walletAccountId];

                if (!wasmAccount || !walletAccount.Addresses.length) {
                    continue;
                }

                const highestApiIndex = await getBitcoinAddressHighestIndex(walletId, walletAccountId);

                // TODO: interact with useWalletsChainData to do sync
                const highestNetworkIndexValue = wasmAccount.account.getLastUnusedAddressIndex();

                let highestIndex = Math.max(highestApiIndex, highestNetworkIndexValue);

                const unusedBitcoinAddress = await api
                    .bitcoin_address()
                    .getBitcoinAddresses(walletId, walletAccountId)
                    .then((data) => data[0]);

                const computeAddressDataFromIndex = async (index: number) => {
                    const { address } = wasmAccount.account.getAddress(index);

                    const [primaryKey] = userKeys;
                    const signature = await CryptoProxy.signMessage({
                        signingKeys: [primaryKey.privateKey],
                        textData: address,
                        detached: true,
                    });

                    return {
                        BitcoinAddressIndex: index,
                        BitcoinAddress: address,
                        BitcoinAddressSignature: signature,
                    };
                };

                // Create missing addresses
                const addressesToCreate = Math.max(0, POOL_FILLING_THRESHOLD - unusedBitcoinAddress.length);

                if (addressesToCreate > 0) {
                    const payload = new WasmApiBitcoinAddressesCreationPayload();

                    for (let i = 1; i <= addressesToCreate; i++) {
                        highestIndex = highestIndex + 1;

                        try {
                            const addressData = await computeAddressDataFromIndex(highestIndex);
                            payload.push(addressData);
                        } catch (e) {
                            console.error('Could not create bitcoin address creation payload', e);
                        }
                    }

                    try {
                        await api.bitcoin_address().addBitcoinAddress(walletId, walletAccountId, payload);
                    } catch (e) {
                        console.error('Could not add new bitcoin addresses', e);
                    }
                }

                // Update addresses without bitcoin address
                const addressesToUpdate = unusedBitcoinAddress.filter((address) => !address.Data.BitcoinAddress);
                if (addressesToUpdate.length) {
                    for (const addressToUpdate of addressesToUpdate) {
                        highestIndex = highestIndex + 1;

                        try {
                            const addressData = await computeAddressDataFromIndex(highestIndex);

                            await api
                                .bitcoin_address()
                                .updateBitcoinAddress(walletId, walletAccountId, addressToUpdate.Data.ID, addressData);
                        } catch (e) {
                            console.error('Could not update bitcoin address', e);
                        }
                    }
                }
            }
        }
        setIsLoading(false);
    }, [decryptedApiWalletsData, getBitcoinAddressHighestIndex, userKeys, walletsChainData]);

    return { isLoading, fillPool };
};
