import { act } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { WasmNetwork } from '@proton/andromeda';
import { toWalletAccountSelectorOptions } from '@proton/wallet';
import {
    apiWalletsData,
    mockUseHideAmounts,
    mockUseUserWalletSettings,
    mockUseWalletAccountExchangeRate,
} from '@proton/wallet/tests';

import { WalletAccountSelector } from '.';
import { formatToSubset, getWalletsChainDataInit } from '../../contexts/BitcoinBlockchainContext/useWalletsChainData';
import { mockUseBitcoinBlockchainContext } from '../../tests';

describe('WalletAccountSelector', () => {
    const [firstWallet, secondWallet] = apiWalletsData;
    const { Wallet, WalletAccounts } = firstWallet;

    beforeEach(async () => {
        mockUseWalletAccountExchangeRate();
        mockUseUserWalletSettings();
        mockUseHideAmounts();

        mockUseBitcoinBlockchainContext({
            walletsChainData: await getWalletsChainDataInit({
                apiWalletsData: formatToSubset(apiWalletsData) ?? [],
                network: WasmNetwork.Testnet,
            }),
        });
    });

    it('should select correct wallet account', async () => {
        const mockOnSelect = vi.fn();
        render(
            <WalletAccountSelector
                value={[Wallet, WalletAccounts[0]]}
                options={toWalletAccountSelectorOptions(apiWalletsData)}
                onSelect={mockOnSelect}
            />
        );

        // Same wallet, different wallet account
        const dropdownButton = await screen.findByTestId('wallet-account-dropdown-trigger');
        await fireEvent.click(dropdownButton);

        const walletAccountOptionButton = await screen.findByTestId(`wallet-account-option-${WalletAccounts[1].ID}`);
        await act(async () => {
            await fireEvent.click(walletAccountOptionButton);
        });

        expect(mockOnSelect).toHaveBeenCalledTimes(1);
        expect(mockOnSelect).toHaveBeenCalledWith([Wallet, WalletAccounts[1]]);

        // Different wallet
        mockOnSelect.mockClear();
        const dropdownButton2 = await screen.findByTestId('wallet-account-dropdown-trigger');
        await act(async () => {
            await fireEvent.click(dropdownButton2);
        });

        const walletAccountOptionButton2 = await screen.findByTestId(
            `wallet-account-option-${secondWallet.WalletAccounts[0].ID}`
        );
        await act(async () => {
            await fireEvent.click(walletAccountOptionButton2);
        });

        expect(mockOnSelect).toHaveBeenCalledTimes(1);
        expect(mockOnSelect).toHaveBeenCalledWith([secondWallet.Wallet, secondWallet.WalletAccounts[0]]);
    });

    it('should disable accounts based on checkIsValid', async () => {
        render(
            <WalletAccountSelector
                value={[Wallet, WalletAccounts[0]]}
                options={toWalletAccountSelectorOptions(apiWalletsData)}
                onSelect={vi.fn()}
                checkIsValid={async (w, a) => {
                    return a.ID !== WalletAccounts[1].ID;
                }}
            />
        );

        // Open dropdown
        const dropdownButton = await screen.findByTestId('wallet-account-dropdown-trigger');
        await act(async () => {
            await fireEvent.click(dropdownButton);
        });

        const walletAccountOptionButton = await screen.findByTestId(`wallet-account-option-${WalletAccounts[1].ID}`);
        expect(walletAccountOptionButton).toBeDisabled();
    });
});
