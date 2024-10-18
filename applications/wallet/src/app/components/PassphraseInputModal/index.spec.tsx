import { act } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { type DecryptedApiWalletKey, type IWasmApiWalletData, decryptWalletData } from '@proton/wallet';
import { apiWalletsData, mockUseWalletDispatch } from '@proton/wallet/tests';

import { PassphraseInputModal } from '.';
import { mockUseBitcoinBlockchainContext } from '../../tests';

describe('PassphraseInputModal', () => {
    const secretEntropy = generateKey();
    let key: CryptoKey;

    let mockedWallet: IWasmApiWalletData;

    const mockSetItem = vi.spyOn(localStorage, 'setItem');
    const mockDispatch = vi.fn();

    beforeEach(async () => {
        mockUseWalletDispatch(mockDispatch);
        mockUseBitcoinBlockchainContext();

        key = await importKey(secretEntropy);
        mockedWallet = {
            ...apiWalletsData[0],
            Wallet: { ...apiWalletsData[0].Wallet, HasPassphrase: 1, Fingerprint: 'fdb185ad' },
            WalletKey: {
                ...(apiWalletsData[0].WalletKey as DecryptedApiWalletKey),
                DecryptedKey: key,
            },
        };
    });

    it('should display wrong passphrase warning', async () => {
        render(<PassphraseInputModal wallet={mockedWallet} open onClose={vi.fn()} onExit={vi.fn()} />);

        const input = await screen.findByTestId('passphrase-input');
        await fireEvent.change(input, { target: { value: 'my-wrong-passphrase' } });
        const confirmButton = await screen.findByTestId('passphrase-confirm-button');

        expect(() => screen.findByText("Fingerprint doesn't match stored one"));
        expect(confirmButton).toBeDisabled();
    });

    it('should add passphrase to wallet', async () => {
        render(<PassphraseInputModal wallet={mockedWallet} open onClose={vi.fn()} onExit={vi.fn()} />);

        const input = await screen.findByTestId('passphrase-input');
        await fireEvent.change(input, { target: { value: 'my-passphrase' } });

        const confirmButton = await screen.findByTestId('passphrase-confirm-button');

        expect(() => {
            expect(screen.queryByTestId("Fingerprint doesn't match stored one")).not.toBeInTheDocument();
        });
        expect(confirmButton).toBeEnabled();

        await act(async () => {
            await fireEvent.click(confirmButton);
        });

        expect(mockSetItem).toHaveBeenCalledTimes(1);
        expect(mockSetItem).toHaveBeenCalledWith('passphrase_fdb185ad', expect.any(String));

        const decryptedStoragePassphrase = await decryptWalletData([mockSetItem.mock.lastCall?.[1] ?? null], key);
        expect(decryptedStoragePassphrase).toStrictEqual(['my-passphrase']);

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            payload: {
                passphrase: 'my-passphrase',
                walletID: '0',
            },
            type: 'wallet/set-passphrase',
        });
    });
});
