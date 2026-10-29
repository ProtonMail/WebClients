import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { MOCK_LUMO_CREDIT_RESPONSE } from '@proton/payments/testing/lumo-credit';

import { setDebugApiCreditBalance } from '../../services/apiUsageDebugStore';
import { ApiUsageDashboard } from './ApiUsageDashboard';
import { useCanBuyLumoCredits } from './useCanBuyLumoCredits';

jest.mock('@proton/account/paymentStatus/hooks');
jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/account/user/hooks');
jest.mock('@proton/app-context/useApi');
jest.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-lumo' }) }));
jest.mock('./ApiTokenUsageChart', () => ({ ApiTokenUsageChart: () => null }));
jest.mock('@proton/components/containers/payments/LumoCreditsModal', () => ({
    LumoCreditsModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
        open ? <button onClick={onClose}>Close top-up</button> : null,
}));
jest.mock('./useCanBuyLumoCredits');

const withBalance = (Balance: string) => () => Promise.resolve({ ...MOCK_LUMO_CREDIT_RESPONSE, Balance });

const setup = (
    response: () => Promise<unknown>,
    { hasSubscription = true, isOrgMember = false }: { hasSubscription?: boolean; isOrgMember?: boolean } = {}
) => {
    const api = jest.fn().mockImplementation(response);
    (useApi as jest.Mock).mockReturnValue(api);
    (useUser as jest.Mock).mockReturnValue([{ Credit: 987_654, Currency: 'EUR' }]);
    (useSubscription as jest.Mock).mockReturnValue([hasSubscription ? { Currency: 'USD' } : undefined]);
    (usePaymentStatus as jest.Mock).mockReturnValue([{ CountryCode: 'DE', VendorStates: {} }, false]);
    (useCanBuyLumoCredits as jest.Mock).mockReturnValue(!isOrgMember);
    render(<ApiUsageDashboard isOrgAdmin={false} isOrgMember={isOrgMember} />);
    return api;
};

const getBalanceAmount = () => document.querySelector('.api-usage-balance-amount')?.textContent;

const lowBalanceMessage = 'Your API balance is running low. Top up your balance to avoid interruptions.';
const emptyBalanceMessage = 'API requests are paused. Top up your balance to resume requests.';

describe('ApiUsageDashboard balance card', () => {
    afterEach(() => {
        setDebugApiCreditBalance(null);
    });

    it('shows the Lumo credit balance in the subscription currency', async () => {
        setup(withBalance('15.0000000000'));

        await waitFor(() => expect(getBalanceAmount()).toBe('US$15'));
        expect(screen.queryByText(lowBalanceMessage)).not.toBeInTheDocument();
        expect(screen.queryByText(emptyBalanceMessage)).not.toBeInTheDocument();
    });

    it('estimates the runway from whole credits', async () => {
        setup(withBalance('15.0000000000'));

        expect(await screen.findByText('About 3 days left at current usage')).toBeInTheDocument();
    });

    it('rounds a fractional balance to cents', async () => {
        setup(withBalance('5.5580000000'));

        await waitFor(() => expect(getBalanceAmount()).toBe('US$5.56'));
    });

    it('warns when the balance is running low', async () => {
        setup(withBalance('5.0000000000'));

        expect(await screen.findByText(lowBalanceMessage)).toBeInTheDocument();
        expect(getBalanceAmount()).toBe('US$5');
    });

    it('pauses requests when the balance is empty', async () => {
        setup(withBalance('0.0000000000'));

        expect(await screen.findByText(emptyBalanceMessage)).toBeInTheDocument();
        expect(getBalanceAmount()).toBe('US$0');
    });

    it('shows the balance as unavailable when the request fails', async () => {
        setup(() => Promise.reject(new Error('You do not have an active subscription')));

        expect(await screen.findByText('Balance unavailable')).toBeInTheDocument();
        expect(getBalanceAmount()).toBeUndefined();
        expect(screen.queryByText(emptyBalanceMessage)).not.toBeInTheDocument();
    });

    it('shows a loading state until the balance arrives', () => {
        setup(() => new Promise(() => {}));

        expect(screen.getByText('Loading balance…')).toBeInTheDocument();
        expect(getBalanceAmount()).toBeUndefined();
    });

    it('keeps the Lumo balance when the account credits modal closes', async () => {
        const api = setup(withBalance('15.0000000000'));
        await waitFor(() => expect(getBalanceAmount()).toBe('US$15'));

        fireEvent.click(screen.getByRole('button', { name: 'Top up balance' }));
        fireEvent.click(screen.getByRole('button', { name: 'Close top-up' }));

        expect(screen.queryByRole('button', { name: 'Close top-up' })).not.toBeInTheDocument();
        expect(getBalanceAmount()).toBe('US$15');
        expect(api).toHaveBeenCalledTimes(1);
    });

    it('shows the debug balance override over the fetched balance', async () => {
        setDebugApiCreditBalance(5);
        const api = setup(withBalance('15.0000000000'));

        await waitFor(() => expect(api).toHaveBeenCalled());
        expect(getBalanceAmount()).toBe('US$5');
        expect(screen.getByText(lowBalanceMessage)).toBeInTheDocument();
    });

    it('falls back to the user currency without a subscription', async () => {
        setup(withBalance('15.0000000000'), { hasSubscription: false });

        await waitFor(() => expect(getBalanceAmount()).toBe('15\u00a0€'));
    });

    it('shows the organization balance to a member without a top-up button', async () => {
        setup(withBalance('15.0000000000'), { isOrgMember: true });

        await waitFor(() => expect(getBalanceAmount()).toBe('US$15'));
        expect(screen.getByText('Organization API balance')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Top up balance' })).not.toBeInTheDocument();
    });
});
