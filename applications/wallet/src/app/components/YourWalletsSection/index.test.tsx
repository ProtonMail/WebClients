import { fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';

import { mockUseNotifications } from '@proton/testing/lib/vitest';

import { YourWalletsSection } from '.';
import { mockUseOnchainWalletContext, mockUseWalletDispatch, walletsWithAccountsWithBalanceAndTxs } from '../../tests';

// TODO: Fix vitest vs @proton/components circular deps to be able to remove this mock
vi.mock('@proton/components/components/confirmActionModal/ConfirmActionModal', () => ({ ConfirmActionModal: 'div' }));

describe('YourWalletsSection', () => {
    beforeEach(() => {
        mockUseOnchainWalletContext();
        mockUseNotifications();
        mockUseWalletDispatch();
    });

    it('should display wallets with their balance and their type', () => {
        render(<YourWalletsSection onAddWallet={vi.fn()} />);

        const balanceCards = screen.getAllByTestId('wallet-balance-card');
        expect(balanceCards).toHaveLength(walletsWithAccountsWithBalanceAndTxs.length);

        expect(within(balanceCards[0]).getByRole('heading', { level: 3, name: 'Bitcoin 01' }));
        expect(within(balanceCards[0]).getByText('Onchain'));
        expect(balanceCards[0]).toHaveTextContent('0.118841 BTC');
        expect(balanceCards[0]).toHaveTextContent('$434.67');

        expect(within(balanceCards[1]).getByRole('heading', { level: 3, name: 'Savings on Jade' }));
        expect(within(balanceCards[1]).getByText('Onchain'));
        expect(balanceCards[1]).toHaveTextContent('0.083848 BTC');
        expect(balanceCards[1]).toHaveTextContent('$306.68');

        expect(within(balanceCards[2]).getByRole('heading', { level: 3, name: 'Savings on Electrum' }));
        expect(within(balanceCards[2]).getByText('Onchain'));
        expect(balanceCards[2]).toHaveTextContent('0.026124 BTC');
        expect(balanceCards[2]).toHaveTextContent('$95.55');
    });

    describe('when user clicks on `Add wallet` card', () => {
        it('should call provided `onAddWallet`', () => {
            const mockedOnAddWallet = vi.fn();

            render(<YourWalletsSection onAddWallet={mockedOnAddWallet} />);

            const addWalletButton = screen.getByRole('button', { name: 'Add wallet' });
            expect(addWalletButton).toBeInTheDocument();

            fireEvent.click(addWalletButton);

            expect(mockedOnAddWallet).toHaveBeenCalledTimes(1);
            expect(mockedOnAddWallet).toHaveBeenCalledWith();
        });
    });
});
