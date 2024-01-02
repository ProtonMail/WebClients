import { render, screen } from '@testing-library/react';
import { describe } from 'vitest';

import { BalanceOverview } from '.';
import { walletsWithAccountsWithBalanceAndTxs } from '../../tests';

vi.mock('react-chartjs-2', () => ({ Doughnut: 'div', Line: 'div' }));

describe('BalanceOverview', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('11/27/2023'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('total balance', () => {
        it("should display bitcoin amount and equivalent in user's currency", () => {
            render(<BalanceOverview wallets={walletsWithAccountsWithBalanceAndTxs} />);

            const balanceContent = screen.getByTestId('balance');
            expect(balanceContent).toHaveTextContent('0.317566 BTC');
            expect(balanceContent).toHaveTextContent('$1161.53');
        });
    });

    describe.todo('balance distribution doughnut char');

    describe('last 7 days difference', () => {
        it("should display last 7 days bitcoin amount difference and equivalent in user's currency", () => {
            render(<BalanceOverview wallets={walletsWithAccountsWithBalanceAndTxs} />);

            const daysDifferenceContent = screen.getByTestId('7DaysDifference');
            expect(daysDifferenceContent).toHaveTextContent('-0.021582 BTC');
            expect(daysDifferenceContent).toHaveTextContent('$-78.94');
        });
    });

    describe.todo('balance evolution line char');
});
