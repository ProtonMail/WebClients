import { act } from 'react';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import { mockUseAddresses, mockUseNotifications, mockUseUserKeys } from '@proton/testing/lib/vitest';
import type { DecryptedApiWalletKey, IWasmApiWalletData } from '@proton/wallet';
import { decryptWalletData } from '@proton/wallet';
import {
    apiWalletsData,
    getAddressKey,
    getUserKeys,
    mockUseUserWalletSettings,
    mockUseWalletApiClients,
    mockUseWalletDispatch,
} from '@proton/wallet/tests';

import { useWalletPreferences } from './useWalletPreferences';

describe('useWalletPreferences', () => {
    const mockCreateNotification = vi.fn();
    const mockDispatch = vi.fn();

    const mockUpdateWalletName = vi.fn();
    const mockSetBitcoinUnit = vi.fn();

    const entropy = generateKey();

    let key: CryptoKey;
    let wallet: IWasmApiWalletData;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        key = await importKey(entropy);

        wallet = {
            ...apiWalletsData[0],
            WalletKey: { ...(apiWalletsData[0].WalletKey as DecryptedApiWalletKey), DecryptedKey: key },
        };
    });

    beforeEach(async () => {
        mockUseUserWalletSettings();
        mockUseWalletApiClients({
            wallet: { updateWalletName: mockUpdateWalletName },
            settings: { setBitcoinUnit: mockSetBitcoinUnit },
        });

        mockUseNotifications({ createNotification: mockCreateNotification });
        mockUseWalletDispatch(mockDispatch);

        const address = await getAddressKey();
        const keys = await getUserKeys();

        mockUseUserKeys([keys]);
        mockUseAddresses([[address.address]]);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should update wallet name', async () => {
        const { result } = await renderHook(() => useWalletPreferences(wallet, vi.fn()));

        act(() => result.current.setWalletName('My test wallet'));
        act(() => result.current.updateWalletName());

        expect(result.current.loadingWalletNameUpdate).toBeTruthy();

        await waitFor(() => expect(mockUpdateWalletName).toHaveBeenCalledTimes(1));
        expect(mockUpdateWalletName).toHaveBeenCalledWith(wallet.Wallet.ID, expect.any(String));
        expect(await decryptWalletData([mockUpdateWalletName.mock.lastCall?.[1]], key)).toStrictEqual([
            'My test wallet',
        ]);

        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Wallet name changed' });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'wallet/update',
            payload: {
                walletID: '0',
                update: { Name: 'My test wallet' },
            },
        });

        expect(result.current.loadingWalletNameUpdate).toBeFalsy();
    });

    it('should update bitcoin unit setting', async () => {
        const { result } = await renderHook(() => useWalletPreferences(wallet, vi.fn()));

        act(() => result.current.updateBitcoinUnit('MBTC'));

        expect(result.current.loadingUserWalletSettings).toBeTruthy();

        await waitFor(() => expect(mockSetBitcoinUnit).toHaveBeenCalledTimes(1));
        expect(mockSetBitcoinUnit).toHaveBeenCalledWith('MBTC');

        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Preferred bitcoin unit was changed' });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'bitcoin-unit/update',
            payload: {
                bitcoinUnit: 'MBTC',
            },
        });

        expect(result.current.loadingUserWalletSettings).toBeFalsy();
    });
});
