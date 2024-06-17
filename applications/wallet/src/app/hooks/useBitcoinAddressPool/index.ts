import { useCallback, useState } from 'react';

import { compact } from 'lodash';

import { WasmApiBitcoinAddressesCreationPayload, WasmApiWalletAccount } from '@proton/andromeda';
import { useGetAddressKeys } from '@proton/components/hooks/useAddressesKeys';
import { IWasmApiWalletData, signData, useWalletApiClients, verifySignedData } from '@proton/wallet';

import { POOL_FILLING_THRESHOLD } from '../../constants/email-integration';
import { useGetBitcoinAddressHighestIndex } from '../../store/hooks/useBitcoinAddressHighestIndex';
import { WalletWithChainData } from '../../types';

export const useBitcoinAddressPool = ({
    decryptedApiWalletsData,
    walletsChainData,
}: {
    decryptedApiWalletsData?: IWasmApiWalletData[];
    walletsChainData: Partial<Record<string, WalletWithChainData>>;
}) => {
    const api = useWalletApiClients();

    const getBitcoinAddressHighestIndex = useGetBitcoinAddressHighestIndex();
    const getAddressKeys = useGetAddressKeys();
    const [isLoading, setIsLoading] = useState(false);

    const fillBitcoinAddressPoolForAccount = useCallback(
        async (walletAccount: WasmApiWalletAccount, walletWithChainData: WalletWithChainData) => {
            const walletId = walletAccount.WalletID;
            const walletAccountId = walletAccount.ID;
            const wasmAccount = walletWithChainData.accounts[walletAccountId];

            if (!wasmAccount || !walletAccount.Addresses.length) {
                return;
            }

            // We only support a single address per wallet account
            const [walletAccountAddress] = walletAccount.Addresses;

            const [primaryAddressKey] = await getAddressKeys(walletAccountAddress.ID);

            const highestApiIndex = await getBitcoinAddressHighestIndex(walletId, walletAccountId);

            // TODO: interact with useWalletsChainData to do sync
            const highestNetworkIndexValue = await wasmAccount.account.getLastUnusedAddressIndex();
            let highestIndex = Math.max(highestApiIndex, highestNetworkIndexValue ?? 0);

            const unusedBitcoinAddresses = await api.bitcoin_address
                .getBitcoinAddresses(walletId, walletAccountId)
                .then((data) => data[0]);

            const computeAddressDataFromIndex = async (index: number) => {
                const { address } = await wasmAccount.account.getAddress(index);
                const signature = await signData(address, 'wallet.bitcoin-address', [primaryAddressKey.privateKey]);

                return {
                    BitcoinAddressIndex: index,
                    BitcoinAddress: address,
                    BitcoinAddressSignature: signature,
                };
            };

            // Create missing addresses
            const addressesToCreate = Math.max(0, POOL_FILLING_THRESHOLD - unusedBitcoinAddresses.length);

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
                    await api.bitcoin_address.addBitcoinAddress(walletId, walletAccountId, payload);
                } catch (e) {
                    console.error('Could not add new bitcoin addresses', e);
                }
            }

            // Update addresses without bitcoin address or with outdated ones
            const addressesWithOutdatedSignature = await Promise.all(
                unusedBitcoinAddresses.map(async (addr) => {
                    if (!addr.Data.BitcoinAddressSignature || !addr.Data.BitcoinAddress) {
                        return addr;
                    }

                    const isVerified = await verifySignedData(
                        addr.Data.BitcoinAddress,
                        addr.Data.BitcoinAddressSignature,
                        'wallet.bitcoin-address',
                        [primaryAddressKey.privateKey]
                    );

                    return isVerified ? undefined : addr;
                })
            );

            for (const addressToUpdate of compact(addressesWithOutdatedSignature)) {
                try {
                    const localHighestIndex = addressToUpdate?.Data.BitcoinAddressIndex ?? highestIndex + 1;

                    const addressData = await computeAddressDataFromIndex(localHighestIndex);
                    highestIndex = localHighestIndex;

                    await api.bitcoin_address.updateBitcoinAddress(
                        walletId,
                        walletAccountId,
                        addressToUpdate.Data.ID,
                        addressData
                    );
                } catch (e) {
                    console.error('Could not update bitcoin address', e);
                }
            }
        },
        [api, getAddressKeys, getBitcoinAddressHighestIndex]
    );

    const fillBitcoinAddressPools = useCallback(
        async (data?: { walletAccountIds?: string[] }) => {
            setIsLoading(true);

            for (const decryptedWallet of decryptedApiWalletsData ?? []) {
                const walletId = decryptedWallet.Wallet.ID;
                const wallet = walletsChainData[walletId];

                // We cannot create address with the wasm wallet
                if (!wallet) {
                    console.warn('Cannot fill bitcoin address pool: wallet is missing');
                    continue;
                }

                const filterWalletAccounts = data?.walletAccountIds
                    ? decryptedWallet.WalletAccounts.filter((a) => data?.walletAccountIds?.includes(a.ID))
                    : decryptedWallet.WalletAccounts;

                for (const walletAccount of filterWalletAccounts) {
                    await fillBitcoinAddressPoolForAccount(walletAccount, wallet);
                }
            }
            setIsLoading(false);
        },
        [decryptedApiWalletsData, fillBitcoinAddressPoolForAccount, walletsChainData]
    );

    return { isLoading, fillBitcoinAddressPools, fillBitcoinAddressPoolForAccount };
};
