import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { WasmTxBuilder } from '@proton/andromeda';

import { OnchainTransactionBuilder } from '.';
import { mockUseBitcoinBlockchainContext, mockUseUserExchangeRate, mockUseWalletSettings } from '../../../tests';
import { apiWalletsData } from '../../../tests/fixtures/api';
import * as useOnchainTransactionBuilderModule from './useOnchainTransactionBuilder';

describe('OnchainTransactionBuilder', () => {
    let helper: ReturnType<typeof useOnchainTransactionBuilderModule.useOnchainTransactionBuilder>;

    const mockUseBitcoinReceive = vi.spyOn(useOnchainTransactionBuilderModule, 'useOnchainTransactionBuilder');

    const [testWallet] = apiWalletsData;
    const [testAccount] = testWallet.WalletAccounts;

    beforeEach(() => {
        mockUseBitcoinBlockchainContext();
        mockUseWalletSettings();
        mockUseUserExchangeRate();

        helper = {
            walletAndAccount: { apiWalletData: testWallet, apiAccount: testAccount },
            wallets: apiWalletsData,
            account: undefined,
            handleSelectWalletAndAccount: vi.fn(),
            addRecipient: vi.fn(),
            updateRecipient: vi.fn(),
            updateRecipientAmountToMax: vi.fn(),
            removeRecipient: vi.fn(),
            updateTxBuilder: vi.fn(),
            createPsbt: vi.fn(),
            erasePsbt: vi.fn(),
            signAndBroadcastPsbt: vi.fn(),
            broadcastedTxId: undefined,
            loadingBroadcast: false,
            finalPsbt: undefined,
            txBuilder: new WasmTxBuilder(),
        };

        mockUseBitcoinReceive.mockReturnValue({ ...helper });
    });

    describe('when a wallet is selected', () => {
        it('should correctly call handler', async () => {
            render(<OnchainTransactionBuilder wallets={apiWalletsData} />);

            const walletSelector = screen.getByTestId('wallet-selector');
            await act(() => userEvent.click(walletSelector));

            const options = screen.getAllByTestId('wallet-selector-option');
            expect(options).toHaveLength(3);
            await fireEvent.click(options[1]);

            expect(helper.handleSelectWalletAndAccount).toHaveBeenCalledTimes(1);
            expect(helper.handleSelectWalletAndAccount).toHaveBeenCalledWith({
                apiWalletData: apiWalletsData[1],
            });
        });
    });

    describe('when selected wallet is of type `onchain`', () => {
        beforeEach(() => {
            const [testWallet] = apiWalletsData;
            const [testAccount] = testWallet.WalletAccounts;

            mockUseBitcoinReceive.mockReturnValue({
                ...helper,
                walletAndAccount: { apiWalletData: testWallet, apiAccount: testAccount },
            });

            render(<OnchainTransactionBuilder wallets={apiWalletsData} />);
        });

        it('should display account selector', () => {
            expect(screen.getByTestId('account-selector')).toBeInTheDocument();
        });

        describe('when a account is selected', () => {
            it('should correctly call handler', async () => {
                const accountSelector = screen.getByTestId('account-selector');
                await act(() => userEvent.click(accountSelector));

                const options = screen.getAllByTestId('account-selector-option');
                expect(options).toHaveLength(2);
                await fireEvent.click(options[1]);

                expect(helper.handleSelectWalletAndAccount).toHaveBeenCalledTimes(1);
                expect(helper.handleSelectWalletAndAccount).toHaveBeenCalledWith({
                    apiAccount: apiWalletsData[0].WalletAccounts[1],
                });
            });
        });
    });
});
