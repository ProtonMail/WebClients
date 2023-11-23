import { render, screen, within } from '@testing-library/react';

import { YourWalletsSection } from '.';
import { wallets } from '../../tests';

describe('YourWalletsSection', () => {
    it('should display lightning wallets total balance and fiat amount', () => {
        render(<YourWalletsSection wallets={wallets} />);

        const lightningBalanceContainer = screen.getByTestId('lightning-balance-card');
        expect(lightningBalanceContainer).toBeInTheDocument();

        expect(within(lightningBalanceContainer).getByRole('heading', { level: 3, name: 'Your Checking' }));
        expect(within(lightningBalanceContainer).getByText('Lightning'));
        expect(lightningBalanceContainer).toHaveTextContent('0.027124 BTC');
        expect(lightningBalanceContainer).toHaveTextContent('$99.21');
    });

    it('should display onchain wallets total balance and fiat amount', () => {
        render(<YourWalletsSection wallets={wallets} />);

        const onchainBalanceContainer = screen.getByTestId('onchain-balance-card');
        expect(onchainBalanceContainer).toBeInTheDocument();

        expect(within(onchainBalanceContainer).getByRole('heading', { level: 3, name: 'Your Saving' }));
        expect(within(onchainBalanceContainer).getByText('OnChain'));
        expect(onchainBalanceContainer).toHaveTextContent('0.201688 BTC');
        expect(onchainBalanceContainer).toHaveTextContent('$737.69');
    });

    describe('when user clicks on `Add wallet` card', () => {
        // TODO
    });
});
