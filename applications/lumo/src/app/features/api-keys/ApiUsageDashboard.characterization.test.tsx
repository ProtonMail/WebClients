import type { ReactNode } from 'react';

import { fireEvent, render, screen, within } from '@testing-library/react';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';

import { ApiUsageDashboard } from './ApiUsageDashboard';
import { useCanBuyLumoCredits } from './useCanBuyLumoCredits';

jest.mock('@proton/account/paymentStatus/hooks');
jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/account/user/hooks');
jest.mock('@proton/app-context/useApi');
jest.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-lumo' }) }));
jest.mock('./ApiTokenUsageChart', () => ({
    ApiTokenUsageChart: ({ days }: { days: unknown[] }) => <div data-testid="token-usage-chart">{days.length}</div>,
}));
jest.mock('@proton/components/components/link/SettingsLink', () => ({
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <a href="/users-addresses">{children}</a>,
}));
jest.mock('@proton/components/containers/payments/LumoCreditsModal', () => ({
    LumoCreditsModal: ({ open }: { open: boolean }) => (open ? <div>Credits modal</div> : null),
}));
jest.mock('./useCanBuyLumoCredits');

const setup = ({ isOrgAdmin = false }: { isOrgAdmin?: boolean } = {}) => {
    (useApi as jest.Mock).mockReturnValue(jest.fn(() => new Promise(() => {})));
    (useUser as jest.Mock).mockReturnValue([{ Credit: 0, Currency: 'USD' }]);
    (useSubscription as jest.Mock).mockReturnValue([{ Currency: 'USD' }]);
    (usePaymentStatus as jest.Mock).mockReturnValue([{ CountryCode: 'DE', VendorStates: {} }, false]);
    (useCanBuyLumoCredits as jest.Mock).mockReturnValue(true);
    render(<ApiUsageDashboard isOrgAdmin={isOrgAdmin} isOrgMember={false} />);
};

const getMetric = (label: string) => screen.getAllByText(label)[0].parentElement?.textContent;

describe('ApiUsageDashboard outside the balance amount', () => {
    it('shows the usage metrics for the last 30 days', () => {
        setup();

        expect(getMetric('Balance used')).toContain('$147.37');
        expect(getMetric('Input tokens')).toContain('37.3M');
        expect(getMetric('Output tokens')).toContain('17.0M');
        expect(screen.getByTestId('token-usage-chart')).toHaveTextContent('30');
    });

    it('updates the usage for the selected period', () => {
        setup();

        fireEvent.click(screen.getByLabelText('Usage period'));
        fireEvent.click(within(screen.getByTestId('select-list')).getByText('Last 7 days'));

        expect(screen.getByTestId('token-usage-chart')).toHaveTextContent('7');
        expect(getMetric('Balance used')).not.toContain('$147.37');
    });

    it('exports the usage as CSV', async () => {
        const createObjectURL = jest.fn((_: Blob) => 'blob:usage');
        URL.createObjectURL = createObjectURL;
        URL.revokeObjectURL = jest.fn();
        const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        setup();

        fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

        expect(click).toHaveBeenCalledTimes(1);
        const csv = await createObjectURL.mock.calls[0][0].text();
        expect(csv.split('\n')[0]).toBe('"date","input_tokens","output_tokens","balance_used_usd"');
        expect(csv.split('\n')).toHaveLength(31);
        click.mockRestore();
    });

    it('opens the credits modal from Top up balance', () => {
        setup();

        expect(screen.queryByText('Credits modal')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Top up balance' }));

        expect(screen.getByText('Credits modal')).toBeInTheDocument();
    });

    it('opens the balance settings from Manage', () => {
        setup();

        fireEvent.click(screen.getByRole('button', { name: 'Manage automatic top-up and spending limit' }));

        expect(screen.getByText('Balance settings')).toBeInTheDocument();
    });

    it('shows the member usage to an organization admin', () => {
        setup({ isOrgAdmin: true });

        expect(screen.getByText('Member usage')).toBeInTheDocument();
        expect(screen.getByText('Team member 1')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Search members'), { target: { value: 'Team member 2' } });

        expect(screen.queryByText('Team member 1')).not.toBeInTheDocument();
        expect(screen.getByText('Team member 2')).toBeInTheDocument();
    });

    it('hides the member usage from a non-admin', () => {
        setup();

        expect(screen.queryByText('Member usage')).not.toBeInTheDocument();
    });
});
