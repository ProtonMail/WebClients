import { BrowserRouter } from 'react-router-dom';

import { render, screen, within } from '@testing-library/react';

import { TransactionHistoryOverview } from '.';
import { mockUseUserExchangeRate, mockUseWalletSettings, simpleTransactions } from '../../tests';

describe('TransactionHistoryOverview', () => {
    beforeEach(() => {
        mockUseUserExchangeRate();
        mockUseWalletSettings();
    });

    it('should display 7 last transactions by default', () => {
        render(<TransactionHistoryOverview transactions={simpleTransactions} />, { wrapper: BrowserRouter });

        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(7);

        // human-readable date
        expect(within(listItems[0]).getByText('22 Nov 2023, 10:37'));
        // transaction id
        expect(within(listItems[0]).getByText('testd49...b1fc22'));
        // transaction amount
        expect(listItems[0]).toHaveTextContent('$-22.66');

        expect(within(listItems[1]).getByText('22 Nov 2023, 05:02'));
        expect(within(listItems[1]).getByText('test780...2d5a9d'));
        expect(listItems[1]).toHaveTextContent('$-33.17');

        expect(within(listItems[2]).getByText('21 Nov 2023, 07:04'));
        expect(within(listItems[2]).getByText('test3ed...53b276'));
        expect(listItems[2]).toHaveTextContent('$-19.38');

        expect(within(listItems[3]).getByText('21 Nov 2023, 06:24'));
        expect(within(listItems[3]).getByText('test526...95d7fe'));
        expect(listItems[3]).toHaveTextContent('$-3.73');

        expect(within(listItems[4]).getByText('19 Nov 2023, 09:09'));
        expect(within(listItems[4]).getByText('test667...9a7790'));
        expect(listItems[4]).toHaveTextContent('$14.77');

        expect(within(listItems[5]).getByText('19 Nov 2023, 06:33'));
        expect(within(listItems[5]).getByText('test5ff...d88c1d'));
        expect(listItems[5]).toHaveTextContent('$-17.50');

        expect(within(listItems[6]).getByText('19 Nov 2023, 02:08'));
        expect(within(listItems[6]).getByText('testc1a...4a4cbe'));
        expect(listItems[6]).toHaveTextContent('$24.87');
    });

    describe('when max is provided', () => {
        it('should display max or less transactions', () => {
            render(<TransactionHistoryOverview transactions={simpleTransactions} max={2} />, {
                wrapper: BrowserRouter,
            });

            expect(screen.getAllByRole('listitem')).toHaveLength(2);
        });
    });
});
