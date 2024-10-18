import { type ChangeEvent, act } from 'react';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { type WasmApiEmailAddress, WasmNetwork } from '@proton/andromeda';
import { generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import { mockUseAddresses, mockUseNotifications, mockUseUserKeys } from '@proton/testing/lib/vitest';
import { type DecryptedApiWalletKey, type IWasmApiWalletData, decryptWalletData } from '@proton/wallet';
import {
    apiWalletsData,
    getAddressKey,
    getUserKeys,
    mockUseFiatCurrencies,
    mockUseWalletApiClients,
    mockUseWalletDispatch,
} from '@proton/wallet/tests';

import { formatToSubset, getWalletsChainDataInit } from '../../contexts/BitcoinBlockchainContext/useWalletsChainData';
import { mockUseBitcoinBlockchainContext } from '../../tests';
import { useAccountPreferences } from './useAccountPreferences';

describe('useAccountPreferences', () => {
    const mockCreateNotification = vi.fn();
    const mockDispatch = vi.fn();

    const mockManageBitcoinAddressPool = vi.fn().mockResolvedValue(undefined);

    const mockUpdateWalletAccountLabel = vi.fn();
    const mockDeleteWalletAccount = vi.fn();
    const mockUpdateWalletAccountFiatCurrency = vi.fn();
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
        mockUseFiatCurrencies();
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
                updateWalletAccountLabel: mockUpdateWalletAccountLabel,
                deleteWalletAccount: mockDeleteWalletAccount,
                updateWalletAccountFiatCurrency: mockUpdateWalletAccountFiatCurrency,
                addEmailAddress: mockAddEmailAddress,
                removeEmailAddress: mockRemoveEmailAddress,
            },
        });

        mockUseWalletDispatch(mockDispatch);

        const address = await getAddressKey();
        const keys = await getUserKeys();

        mockUseUserKeys([keys]);
        mockUseAddresses([[address.address]]);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should update wallet account label', async () => {
        const { result } = renderHook(() => useAccountPreferences(wallet, walletAccount, apiWalletsData.slice(1)));

        act(() =>
            result.current.onChangeLabel({ target: { value: 'My brand new label' } } as ChangeEvent<HTMLInputElement>)
        );

        act(() => {
            result.current.updateWalletAccountLabel();
        });

        await waitFor(() => expect(mockUpdateWalletAccountLabel).toHaveBeenCalledTimes(1));
        expect(mockUpdateWalletAccountLabel).toHaveBeenCalledWith(
            wallet.Wallet.ID,
            walletAccount.ID,
            expect.any(String)
        );

        // decrypted label
        const decrypted = await decryptWalletData([mockUpdateWalletAccountLabel.mock.lastCall[2]], key);
        expect(decrypted).toStrictEqual(['My brand new label']);

        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Account name changed' });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            payload: {
                update: {
                    Label: 'My brand new label',
                },
                walletAccountID: '8',
                walletID: '0',
            },
            type: 'wallet-account/update',
        });
    });

    it('should delete wallet account', async () => {
        const { result } = renderHook(() => useAccountPreferences(wallet, walletAccount, apiWalletsData.slice(1)));

        act(() => {
            result.current.deleteWalletAccount();
        });

        await waitFor(() => expect(mockDeleteWalletAccount).toHaveBeenCalledTimes(1));
        expect(mockDeleteWalletAccount).toHaveBeenCalledWith(wallet.Wallet.ID, walletAccount.ID);

        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Account was deleted' });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            payload: {
                walletAccountID: '8',
                walletID: '0',
            },
            type: 'wallet-account/delete',
        });
    });

    it('should update fiat currency', async () => {
        const { result } = renderHook(() => useAccountPreferences(wallet, walletAccount, apiWalletsData.slice(1)));

        await act(() => result.current.onChangeFiatCurrency('AUD'));

        await waitFor(() => expect(mockUpdateWalletAccountFiatCurrency).toHaveBeenCalledTimes(1));
        expect(mockUpdateWalletAccountFiatCurrency).toHaveBeenCalledWith(wallet.Wallet.ID, walletAccount.ID, 'AUD');

        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'New fiat currency applied' });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            payload: {
                update: {
                    FiatCurrency: 'AUD',
                },
                walletAccountID: '8',
                walletID: '0',
            },
            type: 'wallet-account/update',
        });
    });

    it('should add email address', async () => {
        const addresses: WasmApiEmailAddress[] = [
            {
                ID: 'testEmailAddressId',
                Email: 'test@test.com',
            },
        ];

        mockAddEmailAddress.mockResolvedValue({ Data: { ID: walletAccount.ID, Addresses: addresses } });

        const { result } = renderHook(() => useAccountPreferences(wallet, walletAccount, apiWalletsData.slice(1)));

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

        const { result } = renderHook(() => useAccountPreferences(wallet, walletAccount, apiWalletsData.slice(1)));

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

        const { result } = renderHook(() => useAccountPreferences(wallet, walletAccount, apiWalletsData.slice(1)));

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
