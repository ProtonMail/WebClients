import { useCallback, useEffect, useMemo, useState } from 'react';

import { type WasmAddressDetailsData, type WasmApiWalletAccount, WasmKeychainKind } from '@proton/andromeda';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';
import { type IWasmApiWalletData } from '@proton/wallet';
import { useBitcoinAddressPool } from '@proton/wallet/store';

import { ITEMS_PER_PAGE } from '../../../constants';
import { useBitcoinBlockchainContext } from '../../../contexts';
import { useBlockchainClient } from '../../../hooks/useBlockchainClient';
import { useEmailIntegration } from '../../../hooks/useEmailIntegration';
import { useLocalPagination } from '../../../hooks/useLocalPagination';
import { getAccountWithChainDataFromManyWallets } from '../../../utils';

export const useAddressTable = ({
    wallet,
    walletAccount,
}: {
    wallet: IWasmApiWalletData;
    walletAccount: WasmApiWalletAccount;
}) => {
    const [addresses, setAddresses] = useState<WasmAddressDetailsData[]>([]);
    const { walletsChainData, apiWalletsData } = useBitcoinBlockchainContext();
    const blockchainClient = useBlockchainClient();
    const [loading, withLoading] = useLoading();
    const [keychain, setKeychain] = useState(WasmKeychainKind.External);

    const { currentPage, handleNext, handlePrev } = useLocalPagination();

    const [bitcoinAddressPool] = useBitcoinAddressPool(wallet.Wallet.ID, walletAccount.ID);

    const walletIndex = apiWalletsData?.findIndex((w) => w.Wallet.ID === wallet.Wallet.ID) ?? -1;
    const otherWallets = useMemo(
        () => [...(apiWalletsData?.slice(0, walletIndex) ?? []), ...(apiWalletsData?.slice(walletIndex + 1) ?? [])],
        [apiWalletsData, walletIndex]
    );

    const emailIntegration = useEmailIntegration(wallet, walletAccount, otherWallets);

    const sync = useCallback(
        (force_sync: boolean) => {
            const pagination = { skip: currentPage * ITEMS_PER_PAGE, take: ITEMS_PER_PAGE + 1 };
            const account = getAccountWithChainDataFromManyWallets(
                walletsChainData,
                wallet.Wallet.ID,
                walletAccount.ID
            );

            if (account) {
                void withLoading(
                    account.account
                        .getAddresses(pagination, blockchainClient, keychain, force_sync)
                        .then((addresses) => {
                            setAddresses(addresses[0]);
                        })
                        .catch(noop)
                );
            }
        },
        [blockchainClient, currentPage, wallet.Wallet.ID, walletAccount.ID, walletsChainData, keychain, withLoading]
    );

    useEffect(() => {
        sync(false);
    }, [sync]);

    const toggleKeychain = () => {
        setKeychain((prev) =>
            prev === WasmKeychainKind.External ? WasmKeychainKind.Internal : WasmKeychainKind.External
        );
    };

    return {
        emailIntegration,

        keychain,
        toggleKeychain,

        addresses,
        loading,
        bitcoinAddressPool,
        currentPage,
        handleNext,
        handlePrev,
        sync,
    };
};
