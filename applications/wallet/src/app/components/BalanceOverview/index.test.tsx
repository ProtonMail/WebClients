import { render, screen } from '@testing-library/react';

import { BalanceOverview } from '.';
import { transactions, wallets } from '../../tests';

jest.mock('react-chartjs-2', () => ({ Doughnut: 'div', Line: 'div' }));

describe('BalanceOverview', () => {
    describe('total balance', () => {
        it("should display bitcoin amount and equivalent in user's currency", () => {
            render(<BalanceOverview wallets={wallets} transactions={transactions} />);

            const balanceContent = screen.getByTestId('balance');
            expect(balanceContent).toHaveTextContent('0.228812 BTC');
            expect(balanceContent).toHaveTextContent('$836.90');
        });
    });

    describe('balance distribution doughnut char', () => {
        // TODO
    });

    describe('last 7 days difference', () => {
        it("should display last 7 days bitcoin amount difference and equivalent in user's currency", () => {
            render(<BalanceOverview wallets={wallets} transactions={transactions} />);

            const daysDifferenceContent = screen.getByTestId('7DaysDifference');
            expect(daysDifferenceContent).toHaveTextContent('-0.079205 BTC');
            expect(daysDifferenceContent).toHaveTextContent('$-289.70');
        });

        it('should display danger color when negative balance difference', () => {
            render(<BalanceOverview wallets={wallets} transactions={transactions} />);

            const balanceDifference = screen.getByText('-0.079205 BTC');
            expect(balanceDifference).toHaveClass('color-danger');
        });

        it('should display success color when positive balance difference', () => {
            render(
                <BalanceOverview
                    wallets={wallets}
                    transactions={transactions.map((tx) => ({ ...tx, value: -tx.value }))}
                />
            );

            const balanceDifference = screen.getByText('0.079205 BTC');
            expect(balanceDifference).toHaveClass('color-success');
        });
    });

    describe('balance evolution line char', () => {
        // TODO
    });
});
