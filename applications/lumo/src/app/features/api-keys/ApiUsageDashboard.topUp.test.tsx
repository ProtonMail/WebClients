import { act, fireEvent, render, screen } from '@testing-library/react';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { MOCK_LUMO_CREDIT_RESPONSE } from '@proton/payments/testing/lumo-credit';

import { ApiUsageDashboard } from './ApiUsageDashboard';

jest.mock('@proton/account/paymentStatus/hooks');
jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/account/user/hooks');
jest.mock('@proton/app-context/useApi');
jest.mock('@proton/account/bootstrap', () => ({
    coreEventManagerV6: () => ({ subscribe: () => () => {}, start: () => {}, reset: () => {} }),
}));
jest.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-lumo' }) }));
jest.mock('./ApiTokenUsageChart', () => ({ ApiTokenUsageChart: () => null }));
jest.mock('@proton/components/containers/payments/LumoCreditsModal', () => ({
    LumoCreditsModal: ({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) =>
        open ? (
            <div>
                Add funds
                <button
                    onClick={() => {
                        onSuccess();
                        onClose();
                    }}
                >
                    Buy funds
                </button>
                <button onClick={onClose}>Cancel funds</button>
            </div>
        ) : null,
}));

const setup = (balances: string[], { canTopUp }: { canTopUp?: boolean } = {}) => {
    const remainingBalances = [...balances];
    const api = jest.fn(() =>
        Promise.resolve({
            ...MOCK_LUMO_CREDIT_RESPONSE,
            Balance: remainingBalances.length > 1 ? remainingBalances.shift() : remainingBalances[0],
        })
    );
    (useApi as jest.Mock).mockReturnValue(api);
    (useUser as jest.Mock).mockReturnValue([{ Credit: 0, Currency: 'USD' }]);
    (useSubscription as jest.Mock).mockReturnValue([{ Currency: 'USD' }]);
    (usePaymentStatus as jest.Mock).mockReturnValue([{ CountryCode: 'CH', VendorStates: {} }, false]);
    render(<ApiUsageDashboard isOrgAdmin={false} isOrgMember={false} canTopUp={canTopUp} />);
    return api;
};

const getBalanceAmount = () => document.querySelector('.api-usage-balance-amount')?.textContent;
const advance = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));
const openTopUp = () => fireEvent.click(screen.getByRole('button', { name: 'Top up balance' }));

describe('ApiUsageDashboard top-up', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('opens the Lumo credits modal from Top up balance', async () => {
        setup(['25']);
        await advance(0);

        openTopUp();

        expect(screen.getByText('Add funds')).toBeInTheDocument();
    });

    it('hides Top up balance from someone who cannot buy Lumo credits', async () => {
        setup(['25'], { canTopUp: false });
        await advance(0);

        expect(getBalanceAmount()).toBe('US$25');
        expect(screen.queryByRole('button', { name: 'Top up balance' })).not.toBeInTheDocument();
    });

    it('polls the balance after a purchase until it increases', async () => {
        const api = setup(['25', '25', '45']);
        await advance(0);
        expect(getBalanceAmount()).toBe('US$25');

        openTopUp();
        fireEvent.click(screen.getByRole('button', { name: 'Buy funds' }));
        await advance(3000);
        expect(getBalanceAmount()).toBe('US$25');
        await advance(3000);

        expect(getBalanceAmount()).toBe('US$45');
        await advance(30_000);
        expect(api).toHaveBeenCalledTimes(3);
    });

    it('does not poll the balance when the top-up is cancelled', async () => {
        const api = setup(['25', '45']);
        await advance(0);

        openTopUp();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel funds' }));
        await advance(30_000);

        expect(api).toHaveBeenCalledTimes(1);
        expect(getBalanceAmount()).toBe('US$25');
    });

    it('stops polling after 15 seconds without a balance increase', async () => {
        const api = setup(['25']);
        await advance(0);

        openTopUp();
        fireEvent.click(screen.getByRole('button', { name: 'Buy funds' }));
        await advance(15_000);
        expect(api).toHaveBeenCalledTimes(6);

        await advance(30_000);
        expect(api).toHaveBeenCalledTimes(6);
    });
});
