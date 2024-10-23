import { act } from 'react';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { type WasmApiEmailAddress, WasmNetwork } from '@proton/andromeda';
import { generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import { mockUseAddresses, mockUseNotifications } from '@proton/testing/lib/vitest';
import { type DecryptedApiWalletKey, type IWasmApiWalletData } from '@proton/wallet';
import { apiWalletsData, getAddressKey, mockUseWalletApiClients, mockUseWalletDispatch } from '@proton/wallet/tests';

import { formatToSubset, getWalletsChainDataInit } from '../contexts/BitcoinBlockchainContext/useWalletsChainData';
import { mockUseBitcoinBlockchainContext } from '../tests';
import { useEmailIntegration } from './useEmailIntegration';

describe('useEmailIntegration', () => {
    const mockCreateNotification = vi.fn();
    const mockDispatch = vi.fn();

    const mockManageBitcoinAddressPool = vi.fn().mockResolvedValue(undefined);

    const mockAddEmailAddress = vi.fn();
    const mockRemoveEmailAddress = vi.fn();

    const entropy = generateKey();

    let key: CryptoKey;
    let wallet: IWasmApiWalletData;

    const walletAccount = apiWalletsData[0].WalletAccounts[0];

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        key = await importKey(entropy);

        wallet = {
            ...apiWalletsData[0],
            WalletKey: { ...(apiWalletsData[0].WalletKey as DecryptedApiWalletKey), DecryptedKey: key },
        };
    });

    beforeEach(async () => {
        mockUseNotifications({ createNotification: mockCreateNotification });
        mockUseBitcoinBlockchainContext({
            manageBitcoinAddressPool: mockManageBitcoinAddressPool,
            walletsChainData: await getWalletsChainDataInit({
                apiWalletsData: formatToSubset(apiWalletsData) ?? [],
                network: WasmNetwork.Testnet,
            }),
        });
        mockUseWalletApiClients({
            wallet: {
                addEmailAddress: mockAddEmailAddress,
                removeEmailAddress: mockRemoveEmailAddress,
            },
        });

        mockUseWalletDispatch(mockDispatch);

        const address = await getAddressKey();
        mockUseAddresses([[address.address]]);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should add email address', async () => {
        const addresses: WasmApiEmailAddress[] = [
            {
                ID: 'testEmailAddressId',
                Email: 'test@test.com',
            },
        ];

        mockAddEmailAddress.mockResolvedValue({ Data: { ID: walletAccount.ID, Addresses: addresses } });

        const { result } = renderHook(() => useEmailIntegration(wallet, walletAccount, apiWalletsData.slice(1)));

        act(() => {
            result.current.onAddEmailAddress('testEmailAddressId');
        });

        await waitFor(() => expect(mockAddEmailAddress).toHaveBeenCalledTimes(1));
        expect(mockAddEmailAddress).toHaveBeenCalledWith(wallet.Wallet.ID, walletAccount.ID, 'testEmailAddressId');

        expect(mockManageBitcoinAddressPool).toHaveBeenCalledTimes(1);

        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Email address has been added' });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            payload: {
                update: { Addresses: addresses },
                walletAccountID: '8',
                walletID: '0',
            },
            type: 'wallet-account/update',
        });
    });

    it('should remove email address', async () => {
        const addresses: WasmApiEmailAddress[] = [];
        mockRemoveEmailAddress.mockResolvedValue({ Data: { ID: walletAccount.ID, Addresses: addresses } });

        const { result } = renderHook(() => useEmailIntegration(wallet, walletAccount, apiWalletsData.slice(1)));

        act(() => {
            result.current.onRemoveEmailAddress('testEmailAddressId');
        });

        await waitFor(() => expect(mockRemoveEmailAddress).toHaveBeenCalledTimes(1));
        expect(mockRemoveEmailAddress).toHaveBeenCalledWith(wallet.Wallet.ID, walletAccount.ID, 'testEmailAddressId');

        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Email address has been removed' });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            payload: {
                update: { Addresses: addresses },
                walletAccountID: '8',
                walletID: '0',
            },
            type: 'wallet-account/update',
        });
    });

    it('should replace email address', async () => {
        const updatedAddresses: WasmApiEmailAddress[] = [
            {
                ID: 'testEmailAddressId2',
                Email: 'test@test.com',
            },
        ];

        mockRemoveEmailAddress.mockResolvedValue({ ID: walletAccount.ID, Data: { Addresses: [] } });
        mockAddEmailAddress.mockResolvedValue({ Data: { ID: walletAccount.ID, Addresses: updatedAddresses } });

        const { result } = renderHook(() => useEmailIntegration(wallet, walletAccount, apiWalletsData.slice(1)));

        act(() => {
            result.current.onReplaceEmailAddress('testEmailAddressId', 'testEmailAddressId2');
        });

        await waitFor(() => expect(mockRemoveEmailAddress).toHaveBeenCalledTimes(1));
        expect(mockRemoveEmailAddress).toHaveBeenCalledWith(wallet.Wallet.ID, walletAccount.ID, 'testEmailAddressId');

        expect(mockAddEmailAddress).toHaveBeenCalledTimes(1);
        expect(mockAddEmailAddress).toHaveBeenCalledWith(wallet.Wallet.ID, walletAccount.ID, 'testEmailAddressId2');

        expect(mockManageBitcoinAddressPool).toHaveBeenCalledTimes(1);

        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Email address has been replaced' });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            payload: {
                update: { Addresses: updatedAddresses },
                walletAccountID: '8',
                walletID: '0',
            },
            type: 'wallet-account/update',
        });
    });
});
