import { render, screen } from '@testing-library/react';

import { BalanceOverview } from '.';
import type { WasmSimpleTransaction } from '../../../pkg';
import { walletsWithAccountsWithBalanceAndTxs } from '../../tests';

jest.mock('react-chartjs-2', () => ({ Doughnut: 'div', Line: 'div' }));

describe('BalanceOverview', () => {
    describe('total balance', () => {
        it("should display bitcoin amount and equivalent in user's currency", () => {
            render(<BalanceOverview wallets={walletsWithAccountsWithBalanceAndTxs} />);

            const balanceContent = screen.getByTestId('balance');
            expect(balanceContent).toHaveTextContent('0.317566 BTC');
            expect(balanceContent).toHaveTextContent('$1161.53');
        });
    });

    describe('balance distribution doughnut char', () => {
        // TODO
    });

    describe('last 7 days difference', () => {
        it("should display last 7 days bitcoin amount difference and equivalent in user's currency", () => {
            render(<BalanceOverview wallets={walletsWithAccountsWithBalanceAndTxs} />);

            const daysDifferenceContent = screen.getByTestId('7DaysDifference');
            expect(daysDifferenceContent).toHaveTextContent('0.021406 BTC');
            expect(daysDifferenceContent).toHaveTextContent('$78.29');
        });

        it('should display danger color when negative balance difference', () => {
            render(
                <BalanceOverview
                    wallets={walletsWithAccountsWithBalanceAndTxs.map((wallet) => ({
                        ...wallet,
                        accounts: wallet.accounts.map((account) => ({
                            ...account,
                            transactions: account.transactions.map(
                                (transaction) =>
                                    ({
                                        ...transaction,
                                        value: -transaction.value,
                                    }) as WasmSimpleTransaction
                            ),
                        })),
                    }))}
                />
            );

            const balanceDifference = screen.getByText('-0.021406 BTC');
            expect(balanceDifference).toHaveClass('color-danger');
        });

        it('should display success color when positive balance difference', () => {
            render(<BalanceOverview wallets={walletsWithAccountsWithBalanceAndTxs} />);

            const balanceDifference = screen.getByText('0.021406 BTC');
            expect(balanceDifference).toHaveClass('color-success');
        });
    });

    describe('balance evolution line char', () => {
        // TODO
    });
});
