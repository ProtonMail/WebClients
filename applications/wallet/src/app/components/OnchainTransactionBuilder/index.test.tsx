import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { OnchainTransactionBuilder } from '.';
import { walletsWithAccountsWithBalanceAndTxs } from '../../tests';
import * as useOnchainTransactionBuilderModule from './useOnchainTransactionBuilder';

describe.skip('OnchainTransactionBuilder', () => {
    let helper: ReturnType<typeof useOnchainTransactionBuilderModule.useOnchainTransactionBuilder>;

    const mockUseBitcoinReceiveInfoGenerator = vi.spyOn(
        useOnchainTransactionBuilderModule,
        'useOnchainTransactionBuilder'
    );

    const [testWallet] = walletsWithAccountsWithBalanceAndTxs;
    const [testAccount] = testWallet.accounts;

    beforeEach(() => {
        helper = {
            selectedWallet: testWallet,
            selectedAccount: testAccount,
            handleSelectWallet: vi.fn(),
            handleSelectAccount: vi.fn(),
            addRecipient: vi.fn(),
            updateRecipient: vi.fn(),
            removeRecipient: vi.fn(),
            updateTxBuilder: vi.fn(),
            createPsbt: vi.fn(),
            backToTxBuilder: vi.fn(),
            handleSignAndSend: vi.fn(),
            unitByRecipient: {},
            loadindBroadcast: false,
            txid: undefined,
            finalPsbt: undefined,
            txBuilder: {
                get_recipients: vi.fn().mockReturnValue([]),
                get_fee_rate: vi.fn().mockReturnValue(undefined),
                get_coin_selection: vi.fn(),
                get_utxos_to_spend: vi.fn().mockReturnValue([]),
                get_rbf_enabled: vi.fn().mockReturnValue(true),
                get_change_policy: vi.fn(),
            } as any,
        };

        mockUseBitcoinReceiveInfoGenerator.mockReturnValue({ ...helper });
    });

    describe('when a wallet is selected', () => {
        it('should correctly call handler', async () => {
            render(<OnchainTransactionBuilder wallets={walletsWithAccountsWithBalanceAndTxs} />);

            const walletSelector = screen.getByTestId('wallet-selector');
            await act(() => userEvent.click(walletSelector));

            const options = screen.getAllByTestId('wallet-selector-option');
            expect(options).toHaveLength(4);
            await fireEvent.click(options[1]);

            expect(helper.handleSelectWallet).toHaveBeenCalledTimes(1);
            expect(helper.handleSelectWallet).toHaveBeenCalledWith({ selectedIndex: 1, value: 1 });
        });
    });

    describe('when selected wallet is of type `onchain`', () => {
        beforeEach(() => {
            const [testWallet] = walletsWithAccountsWithBalanceAndTxs;
            const [testAccount] = testWallet.accounts;

            mockUseBitcoinReceiveInfoGenerator.mockReturnValue({
                ...helper,
                selectedWallet: testWallet,
                selectedAccount: testAccount,
            });

            render(<OnchainTransactionBuilder wallets={walletsWithAccountsWithBalanceAndTxs} />);
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

                expect(helper.handleSelectAccount).toHaveBeenCalledTimes(1);
                expect(helper.handleSelectAccount).toHaveBeenCalledWith({ selectedIndex: 1, value: 9 });
            });
        });
    });
});
