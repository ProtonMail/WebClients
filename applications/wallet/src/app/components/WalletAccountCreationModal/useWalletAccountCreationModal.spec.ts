import { act } from 'react';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { type WasmApiWalletAccount, WasmDerivationPath, WasmScriptType } from '@proton/andromeda';
import { generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import { mockUseNotifications, mockUseUserKeys } from '@proton/testing/lib/vitest';
import {
    type DecryptedApiWalletKey,
    type IWasmApiWalletData,
    decryptWalletData,
    encryptWalletDataWithWalletKey,
} from '@proton/wallet';
import {
    apiWalletAccountOneA,
    apiWalletAccountOneB,
    apiWalletsData,
    getUserKeys,
    mockUseWalletApiClients,
    mockUseWalletDispatch,
} from '@proton/wallet/tests';

import { mockUseBitcoinBlockchainContext } from '../../tests';
import { useWalletAccountCreationModal } from './useWalletAccountCreationModal';

describe('useWalletAccountCreationModal', () => {
    const entropy = generateKey();

    let key: CryptoKey;
    let wallet: IWasmApiWalletData;

    const mockCreateWalletAccount = vi.fn();
    const mockClose = vi.fn();

    const mockCreateNotification = vi.fn();
    const mockDispatch = vi.fn();

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        key = await importKey(entropy);

        wallet = {
            ...apiWalletsData[0],
            WalletKey: { ...(apiWalletsData[0].WalletKey as DecryptedApiWalletKey), DecryptedKey: key },
        };
    });

    beforeEach(async () => {
        mockUseBitcoinBlockchainContext();
        mockUseNotifications({ createNotification: mockCreateNotification });
        mockUseWalletDispatch(mockDispatch);
        mockUseWalletApiClients({ wallet: { createWalletAccount: mockCreateWalletAccount } });

        const keys = await getUserKeys();
        mockUseUserKeys([keys]);
    });

    it('should create correct wallet account', async () => {
        const label = 'My test wallet account';
        const [encryptedLabel] = await encryptWalletDataWithWalletKey([label], key);

        const createdAccount: WasmApiWalletAccount = {
            WalletID: '0',
            FiatCurrency: 'USD',
            ID: '8',
            DerivationPath: "86'/1'/2'",
            Label: encryptedLabel,
            LastUsedIndex: 0,
            PoolSize: 10,
            Priority: 1,
            ScriptType: WasmScriptType.Taproot,
            StopGap: 20,
            Addresses: [],
        };

        mockCreateWalletAccount.mockResolvedValue({ Data: createdAccount });

        const { result } = renderHook(() => useWalletAccountCreationModal(wallet, mockClose));

        act(() => result.current.onLabelChange({ target: { value: label } } as any));
        act(() => result.current.onIndexSelect({ value: 2 } as any));
        act(() => result.current.onScriptTypeSelect({ value: WasmScriptType.Taproot } as any));

        await act(() => result.current.createWalletAccount());

        await waitFor(() => expect(mockCreateWalletAccount).toHaveBeenCalledTimes(1));
        expect(mockCreateWalletAccount).toHaveBeenCalledWith(
            '0',
            expect.any(WasmDerivationPath),
            expect.any(String),
            WasmScriptType.Taproot
        );

        const derivationPath: WasmDerivationPath = mockCreateWalletAccount.mock.lastCall?.[1];
        // 86 for taproot script type, 1 for network, 2 for index
        expect(derivationPath.toString()).toBe("86'/1'/2'");

        // decrypted label
        const decrypted = await decryptWalletData([mockCreateWalletAccount.mock.lastCall?.[2]], key);
        expect(decrypted).toStrictEqual(['My test wallet account']);

        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Your account was successfully created' });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'wallet-account/create',
            payload: {
                ...createdAccount,
                Label: label,
            },
        });
    });

    it('should change selected index when used by newly selected script type', () => {
        const { result } = renderHook(() =>
            useWalletAccountCreationModal(
                {
                    ...wallet,
                    WalletAccounts: [
                        ...wallet.WalletAccounts,
                        {
                            ...apiWalletAccountOneB,
                            ID: '-1',
                            DerivationPath: "86'/0'/1'",
                        },
                        {
                            ...apiWalletAccountOneB,
                            ID: '-2',
                            DerivationPath: "86'/0'/2'",
                        },
                        {
                            ...apiWalletAccountOneB,
                            ID: '-3',
                            DerivationPath: "86'/0'/3'",
                        },
                    ],
                },
                mockClose
            )
        );

        // select 3rd index on segwit (default)
        act(() => result.current.onIndexSelect({ value: 2 } as any));

        // select taproot script type (whose 3rd index is already used)
        act(() => result.current.onScriptTypeSelect({ value: WasmScriptType.Taproot } as any));

        expect(result.current.selectedIndex).toBe(4);
        expect(result.current.inputIndex).toBe(4);
    });

    it('should return a map with already used indexes', () => {
        const { result } = renderHook(() =>
            useWalletAccountCreationModal(
                {
                    ...wallet,
                    WalletAccounts: [
                        ...wallet.WalletAccounts,
                        {
                            ...apiWalletAccountOneA,
                            ID: '-1',
                            ScriptType: WasmScriptType.NativeSegwit,
                            DerivationPath: "84'/0'/2'",
                        },
                        {
                            ...apiWalletAccountOneB,
                            ID: '-2',
                            DerivationPath: "86'/0'/1'",
                        },
                        {
                            ...apiWalletAccountOneB,
                            ID: '-3',
                            DerivationPath: "86'/0'/3'",
                        },
                    ],
                },
                mockClose
            )
        );

        expect(result.current.indexesByScriptType).toStrictEqual({
            '3': new Set([0, 2]),
            '4': new Set([0, 1, 3]),
        });
    });
});
