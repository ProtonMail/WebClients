import { fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';

import { YourWalletsSection } from '.';
import { walletsWithAccountsWithBalanceAndTxs } from '../../tests';

describe('YourWalletsSection', () => {
    it('should display lightning wallets total balance and fiat amount', () => {
        render(<YourWalletsSection wallets={walletsWithAccountsWithBalanceAndTxs} onAddWallet={vi.fn()} />);

        const lightningBalanceContainer = screen.getByTestId('lightning-balance-card');
        expect(lightningBalanceContainer).toBeInTheDocument();

        expect(within(lightningBalanceContainer).getByRole('heading', { level: 3, name: 'Your checking' }));
        expect(within(lightningBalanceContainer).getByText('Lightning'));
        expect(lightningBalanceContainer).toHaveTextContent('0.088753 BTC');
        expect(lightningBalanceContainer).toHaveTextContent('$324.62');
    });

    it('should display onchain wallets total balance and fiat amount', () => {
        render(<YourWalletsSection wallets={walletsWithAccountsWithBalanceAndTxs} onAddWallet={vi.fn()} />);

        const onchainBalanceContainer = screen.getByTestId('onchain-balance-card');
        expect(onchainBalanceContainer).toBeInTheDocument();

        expect(within(onchainBalanceContainer).getByRole('heading', { level: 3, name: 'Your saving' }));
        expect(within(onchainBalanceContainer).getByText('OnChain'));
        expect(onchainBalanceContainer).toHaveTextContent('0.228812 BTC');
        expect(onchainBalanceContainer).toHaveTextContent('$836.90');
    });

    describe('when user clicks on `Add wallet` card', () => {
        it('should call provided `onAddWallet`', () => {
            const mockedOnAddWallet = vi.fn();

            render(
                <YourWalletsSection wallets={walletsWithAccountsWithBalanceAndTxs} onAddWallet={mockedOnAddWallet} />
            );

            const addWalletButton = screen.getByRole('button', { name: 'Add wallet' });
            expect(addWalletButton).toBeInTheDocument();

            fireEvent.click(addWalletButton);

            expect(mockedOnAddWallet).toHaveBeenCalledTimes(1);
            expect(mockedOnAddWallet).toHaveBeenCalledWith();
        });
    });
});
