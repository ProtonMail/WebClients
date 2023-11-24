import { render, screen, within } from '@testing-library/react';

import { TransactionHistoryOverview } from '.';
import { transactions } from '../../tests';

describe('TransactionHistoryOverview', () => {
    it('should display 7 last transactions by default, sorted from newest to oldest', () => {
        render(<TransactionHistoryOverview transactions={transactions} />);

        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(7);

        // human-readable date
        expect(within(listItems[0]).getByText('22 Nov 2023, 10:37'));
        // transaction id
        expect(within(listItems[0]).getByText('2'));
        // transaction amount
        const transactionAmount0 = within(listItems[0]).getByText('-0.006195 BTC');
        expect(transactionAmount0).toBeInTheDocument();
        // red when outbound, green when inbound
        expect(transactionAmount0).toHaveClass('color-danger');

        expect(within(listItems[1]).getByText('22 Nov 2023, 05:02'));
        expect(within(listItems[1]).getByText('18'));
        const transactionAmount1 = within(listItems[1]).getByText('-0.009068 BTC');
        expect(transactionAmount1).toBeInTheDocument();
        expect(transactionAmount1).toHaveClass('color-danger');

        expect(within(listItems[2]).getByText('21 Nov 2023, 07:04'));
        expect(within(listItems[2]).getByText('14'));
        const transactionAmount2 = within(listItems[2]).getByText('-0.005298 BTC');
        expect(transactionAmount2).toBeInTheDocument();
        expect(transactionAmount2).toHaveClass('color-danger');

        expect(within(listItems[3]).getByText('21 Nov 2023, 06:24'));
        expect(within(listItems[3]).getByText('11'));
        const transactionAmount3 = within(listItems[3]).getByText('-0.001021 BTC');
        expect(transactionAmount3).toBeInTheDocument();
        expect(transactionAmount3).toHaveClass('color-danger');

        expect(within(listItems[4]).getByText('19 Nov 2023, 09:09'));
        expect(within(listItems[4]).getByText('10'));
        const transactionAmount4 = within(listItems[4]).getByText('0.004037 BTC');
        expect(transactionAmount4).toBeInTheDocument();
        expect(transactionAmount4).toHaveClass('color-success');

        expect(within(listItems[5]).getByText('19 Nov 2023, 06:33'));
        expect(within(listItems[5]).getByText('16'));
        const transactionAmount5 = within(listItems[5]).getByText('-0.004785 BTC');
        expect(transactionAmount5).toBeInTheDocument();
        expect(transactionAmount5).toHaveClass('color-danger');

        expect(within(listItems[6]).getByText('19 Nov 2023, 02:08'));
        expect(within(listItems[6]).getByText('6'));
        const transactionAmount6 = within(listItems[6]).getByText('0.006799 BTC');
        expect(transactionAmount6).toBeInTheDocument();
        expect(transactionAmount6).toHaveClass('color-success');
    });

    describe('when max is provided', () => {
        it('should display max or less transactions', () => {
            render(<TransactionHistoryOverview transactions={transactions} max={2} />);
            expect(screen.getAllByRole('listitem')).toHaveLength(2);
        });
    });
});
