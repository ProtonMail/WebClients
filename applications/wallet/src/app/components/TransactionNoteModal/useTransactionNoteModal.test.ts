import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';

import { generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import { mockUseNotifications } from '@proton/testing/lib/vitest';
import { type DecryptedTransactionData, decryptWalletData } from '@proton/wallet';
import { mockUseApiWalletTransactionData, mockUseWalletApi, mockUseWalletDispatch } from '@proton/wallet/tests';

import { useTransactionNoteModal } from './useTransactionNoteModal';

describe('useTransactionNoteModal', () => {
    const mockedUpdateWalletTransactionLabel = vi.fn();

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    beforeEach(async () => {
        mockUseApiWalletTransactionData([
            {
                xyz: {
                    WalletID: '9',
                    WalletAccountID: '99',
                    ID: '999',
                    Label: 'My test transaction label',
                } as DecryptedTransactionData,
            },
        ]);
        mockUseWalletApi({
            wallet: { updateWalletTransactionLabel: mockedUpdateWalletTransactionLabel },
        });
        mockUseNotifications();
        mockUseWalletDispatch();
    });

    it('should return correct base label', () => {
        const { result } = renderHook(() => useTransactionNoteModal({ transactionDataKey: 'xyz' }));
        expect(result.current.baseLabel).toEqual('My test transaction label');
    });

    it('should save transaction note', async () => {
        const entropy = generateKey();
        const key = await importKey(entropy);

        const { result } = renderHook(() => useTransactionNoteModal({ transactionDataKey: 'xyz', walletKey: key }));

        await act(() => result.current.handleSaveNote('My updated test label'));

        expect(mockedUpdateWalletTransactionLabel).toHaveBeenCalledTimes(1);
        expect(mockedUpdateWalletTransactionLabel).toHaveBeenCalledWith('9', '99', '999', expect.any(String));

        const label = await decryptWalletData([mockedUpdateWalletTransactionLabel.mock.lastCall?.[3]], key);
        expect(label).toStrictEqual(['My updated test label']);
    });
});
