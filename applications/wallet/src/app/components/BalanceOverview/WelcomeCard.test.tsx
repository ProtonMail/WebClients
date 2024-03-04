import { BrowserRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';

import { apiWalletsData } from '../../tests/fixtures/api';
import { WelcomeCard } from './WelcomeCard';

describe('WelcomeCard', () => {
    it('should have link to bitcoin purchase view', () => {
        render(<WelcomeCard />, { wrapper: BrowserRouter });

        const purchaseLink = screen.getByRole('link', { name: 'Buy bitcoins' });
        expect(purchaseLink).toBeInTheDocument();
        expect(purchaseLink).toHaveAttribute('href', '/buy');
    });

    describe('when no wallet is provided', () => {
        it('should render global message', () => {
            render(<WelcomeCard />, { wrapper: BrowserRouter });

            expect(
                screen.getByText('Start using Proton Wallet by either buying or transfering bitcoins.')
            ).toBeInTheDocument();
        });

        it('should render simplelink to global transfer', () => {
            render(<WelcomeCard />, { wrapper: BrowserRouter });

            const transferLink = screen.getByRole('link', { name: 'Transfer bitcoins' });
            expect(transferLink).toBeInTheDocument();
            expect(transferLink).toHaveAttribute('href', '/transfer');
        });
    });

    describe('when wallet is provided', () => {
        it('should render wallet message', () => {
            render(<WelcomeCard apiWalletData={apiWalletsData[1]} />, { wrapper: BrowserRouter });

            expect(
                screen.getByText("Start using your wallet 'Savings on Jade' by either buying or transfering bitcoins.")
            ).toBeInTheDocument();
        });

        it('should render simplelink to wallet transfer', () => {
            render(<WelcomeCard apiWalletData={apiWalletsData[1]} />, { wrapper: BrowserRouter });

            const transferLink = screen.getByRole('link', { name: 'Transfer bitcoins' });
            expect(transferLink).toBeInTheDocument();
            expect(transferLink).toHaveAttribute('href', '/transfer#walletId=1');
        });
    });
});
