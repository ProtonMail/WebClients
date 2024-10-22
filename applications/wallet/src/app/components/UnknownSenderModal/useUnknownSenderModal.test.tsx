import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';

import { setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import { type DecryptedKey } from '@proton/shared/lib/interfaces';
import { mockUseNotifications, mockUseUserKeys } from '@proton/testing/lib/vitest';
import { type DecryptedTransactionData, decryptPgp } from '@proton/wallet';
import { getUserKeys } from '@proton/wallet/tests';
import { mockUseApiWalletTransactionData, mockUseContactEmails, mockUseWalletApi } from '@proton/wallet/tests/mocks';
import { mockUseSaveVCardContact } from '@proton/wallet/tests/mocks/useSaveVCardContact';

import { mockUseWalletDispatch } from '../../tests';
import { useUnknownSenderModal } from './useUnknownSenderModal';

describe('useUnknownSenderModal', () => {
    const mockedUpdateExternalWalletTransactionSender = vi.fn();
    const mockedUseSaveVCardContact = vi.fn();
    let keys: DecryptedKey[];

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    beforeEach(async () => {
        mockUseContactEmails();
        mockUseApiWalletTransactionData([
            { xyz: { WalletID: '9', WalletAccountID: '99', ID: '999' } as DecryptedTransactionData },
        ]);
        mockUseWalletApi({
            wallet: { updateExternalWalletTransactionSender: mockedUpdateExternalWalletTransactionSender },
        });
        mockUseNotifications();
        mockUseSaveVCardContact(mockedUseSaveVCardContact);
        mockUseWalletDispatch();

        keys = await getUserKeys();
        mockUseUserKeys([keys]);
    });

    it('should udpate transaction with sender', async () => {
        const { result } = renderHook(() => useUnknownSenderModal({ hashedTxId: 'xyz' }));

        act(() => result.current.setEmail('alex.rider@proton.me'));
        act(() => result.current.setName('Alex Rider'));

        await act(() => result.current.handleClickSaveSender());

        expect(mockedUpdateExternalWalletTransactionSender).toHaveBeenCalledTimes(1);
        expect(mockedUpdateExternalWalletTransactionSender).toHaveBeenCalledWith('9', '99', '999', expect.any(String));

        const decryptedSender = await decryptPgp(
            mockedUpdateExternalWalletTransactionSender.mock.calls[0][3],
            'utf8',
            keys.map((p) => p.privateKey)
        );
        expect(JSON.parse(decryptedSender)).toStrictEqual({ email: 'alex.rider@proton.me', name: 'Alex Rider' });

        expect(mockedUseSaveVCardContact).toHaveBeenCalledTimes(0);
    });

    it('should save sender as contact', async () => {
        const { result } = renderHook(() => useUnknownSenderModal({ hashedTxId: 'xyz' }));

        act(() => result.current.setEmail('alex.rider@proton.me'));
        act(() => result.current.setName('Alex Rider'));
        act(() => result.current.setShouldSaveAsContact(true));

        await act(() => result.current.handleClickSaveSender());

        expect(mockedUseSaveVCardContact).toHaveBeenCalledTimes(1);
        expect(mockedUseSaveVCardContact).toHaveBeenCalledWith(undefined, {
            email: [
                {
                    field: 'email',
                    uid: 'contact-property-1',
                    value: 'alex.rider@proton.me',
                },
            ],
            fn: [
                {
                    field: 'fn',
                    uid: 'contact-property-0',
                    value: 'Alex Rider',
                },
            ],
        });
    });
});
