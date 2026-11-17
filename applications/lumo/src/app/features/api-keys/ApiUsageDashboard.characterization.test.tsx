import type { ReactNode } from 'react';

import { fireEvent, render, screen, within } from '@testing-library/react';

import { useMembers } from '@proton/account/members/hooks';
import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { MOCK_LUMO_CREDIT_RESPONSE } from '@proton/payments/testing/lumo-credit';
import { MEMBER_ROLE } from '@proton/shared/lib/constants';

import { ApiUsageDashboard } from './ApiUsageDashboard';
import { useApiUsageMembers } from './useApiUsageMembers';
import { useApiUsageSummary } from './useApiUsageSummary';

jest.mock('@proton/account/paymentStatus/hooks');
jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/account/user/hooks');
jest.mock('@proton/app-context/useApi');
jest.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-lumo' }) }));
jest.mock('./ApiTokenUsageChart', () => ({
    ApiTokenUsageChart: ({ days }: { days: { apiInputTokens: number; chatInputTokens?: number }[] }) => (
        <div data-testid="token-usage-chart" data-days={days.length}>
            {days.reduce((sum, day) => sum + day.apiInputTokens + (day.chatInputTokens ?? 0), 0)}
        </div>
    ),
}));
jest.mock('@proton/components/components/link/SettingsLink', () => ({
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <a href="/users-addresses">{children}</a>,
}));
jest.mock('@proton/payments-ui/ui/containers/LumoCreditsModal', () => ({
    LumoCreditsModal: ({ open }: { open: boolean }) => (open ? <div>Credits modal</div> : null),
}));

jest.mock('./useApiUsageSummary');
jest.mock('./useApiUsageMembers');
jest.mock('@proton/account/members/hooks');

const memberTotals = (tokensIn: number, costMicros: number) => ({
    TokensIn: tokensIn,
    TokensInCached: 0,
    TokensGenerated: 0,
    ApiCalls: 1,
    CostMicros: costMicros,
});
const organizationMembers = [
    { ID: 'member-alice', Name: 'Alice', Role: MEMBER_ROLE.ORGANIZATION_ADMIN },
    { ID: 'member-bob', Name: 'Bob', Role: MEMBER_ROLE.ORGANIZATION_MEMBER },
];
const memberUsageRows = [
    { MemberID: 'member-alice', Totals: memberTotals(1_000_000, 2_500_000) },
    { MemberID: 'member-bob', Totals: memberTotals(500_000, 1_250_000) },
    { MemberID: null, Totals: memberTotals(100_000, 250_000) },
];

const usageDates = Array.from({ length: 90 }, (_, index) => `day-${index}`);
const usageRow = (
    date: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    costMicros: number | null,
    clientType = 'api'
) => ({
    Date: date,
    Model: model,
    ClientType: clientType,
    InputTokens: inputTokens,
    OutputTokens: outputTokens,
    Calls: 1,
    CostMicros: costMicros,
});
const usageRows = [
    usageRow('day-89', 'lumo-lite', 1_500_000, 2_000_000, 3_000_000),
    usageRow('day-80', 'lumo-max', 2_000_000, 1_000_000, 4_500_000),
    usageRow('day-40', 'lumo-lite', 9_000_000, 0, 10_000_000),
];

const setup = ({
    isOrgAdmin = false,
    isOrgMember = false,
    creditResponse = new Promise(() => {}),
    showAutoTopUp = false,
    usage = {},
    memberUsage = {},
    isLoadingMembers = false,
}: {
    isOrgAdmin?: boolean;
    isOrgMember?: boolean;
    creditResponse?: Promise<unknown>;
    showAutoTopUp?: boolean;
    usage?: { isLoading?: boolean; error?: boolean; rows?: ReturnType<typeof usageRow>[] };
    memberUsage?: { isLoading?: boolean; error?: boolean; rows?: typeof memberUsageRows };
    isLoadingMembers?: boolean;
} = {}) => {
    (useApi as jest.Mock).mockReturnValue(jest.fn(() => creditResponse));
    (useApiUsageSummary as jest.Mock).mockReturnValue({
        dates: usageDates,
        rows: usageRows,
        isLoading: false,
        error: false,
        ...usage,
    });
    (useApiUsageMembers as jest.Mock).mockReturnValue({
        rows: memberUsageRows,
        isLoading: false,
        error: false,
        ...memberUsage,
    });
    (useMembers as jest.Mock).mockReturnValue([organizationMembers, isLoadingMembers]);
    (useUser as jest.Mock).mockReturnValue([{ Credit: 0, Currency: 'USD' }]);
    (useSubscription as jest.Mock).mockReturnValue([{ Currency: 'USD' }]);
    (usePaymentStatus as jest.Mock).mockReturnValue([{ CountryCode: 'DE', VendorStates: {} }, false]);
    render(<ApiUsageDashboard isOrgAdmin={isOrgAdmin} isOrgMember={isOrgMember} showAutoTopUp={showAutoTopUp} />);
};

const getMetric = (label: string) => screen.getAllByText(label)[0].parentElement?.textContent;
const getMembersSection = () => screen.getByText('Member usage').closest('section') as HTMLElement;
const selectPeriod = (label: string) => {
    fireEvent.click(screen.getByLabelText('Usage period'));
    fireEvent.click(within(screen.getByTestId('select-list')).getByText(label));
};

describe('ApiUsageDashboard outside the balance amount', () => {
    it('shows the usage metrics for the last 30 days', () => {
        setup();

        expect(useApiUsageSummary).toHaveBeenCalledWith('self');
        expect(getMetric('Balance used')).toContain('$7.50');
        expect(getMetric('Input tokens')).toContain('3.5M');
        expect(getMetric('Output tokens')).toContain('3.0M');
        expect(screen.getByTestId('token-usage-chart')).toHaveAttribute('data-days', '30');
        expect(screen.getByText('lumo-max', { selector: '.api-usage-model__name' }).parentElement).toHaveTextContent(
            '$4.50'
        );
    });

    it('updates the usage for the selected period', () => {
        setup();

        selectPeriod('Last 7 days');

        expect(screen.getByTestId('token-usage-chart')).toHaveAttribute('data-days', '7');
        expect(getMetric('Balance used')).toContain('$3.00');

        selectPeriod('Previous 30 days');

        expect(getMetric('Balance used')).toContain('$10.00');
    });

    it('charts only the selected model', () => {
        setup();

        fireEvent.click(screen.getByRole('button', { name: 'lumo-max' }));

        expect(screen.getByTestId('token-usage-chart')).toHaveTextContent('2000000');
    });

    it('charts only the selected source, chat being every client but the API', () => {
        setup({
            usage: {
                rows: [
                    ...usageRows,
                    usageRow('day-89', 'lumo-lite', 600_000, 100_000, 0, 'frontend'),
                    usageRow('day-88', 'lumo-lite', 100_000, 100_000, 0, 'lumo_mail'),
                ],
            },
        });

        expect(screen.getByTestId('token-usage-chart')).toHaveTextContent('4200000');

        fireEvent.click(screen.getByRole('button', { name: 'Chat' }));
        expect(screen.getByTestId('token-usage-chart')).toHaveTextContent('700000');

        fireEvent.click(screen.getByRole('button', { name: 'API' }));
        expect(screen.getByTestId('token-usage-chart')).toHaveTextContent('3500000');
    });

    it('charts the chat usage of the selected model only', () => {
        setup({
            usage: {
                rows: [
                    ...usageRows,
                    usageRow('day-89', 'lumo-lite', 600_000, 0, 0, 'frontend'),
                    usageRow('day-87', 'lumo-max', 50_000, 0, 0, 'scribe'),
                ],
            },
        });

        fireEvent.click(screen.getByRole('button', { name: 'lumo-max' }));
        fireEvent.click(screen.getByRole('button', { name: 'Chat' }));

        expect(screen.getByTestId('token-usage-chart')).toHaveTextContent(/^50000$/);
    });

    it('splits the input and output tokens between API and chat', () => {
        setup({ usage: { rows: [...usageRows, usageRow('day-89', 'lumo-lite', 700_000, 200_000, 0, 'frontend')] } });

        expect(getMetric('Input tokens')).toContain('4.2M');
        expect(getMetric('Input tokens')).toContain('API 3.5M');
        expect(getMetric('Input tokens')).toContain('Chat 700.0k');
        expect(getMetric('Output tokens')).toContain('Chat 200.0k');
    });

    it('does not price the balance used when a model has no known price', () => {
        setup({ usage: { rows: [...usageRows, usageRow('day-89', 'lumo-next', 1, 1, null)] } });

        expect(getMetric('Balance used')).toContain('Not priced yet');
        expect(getMetric('Balance used')).toContain('Estimated spend');
    });

    it('shows zero usage, not the first-request hint, for a period without usage', () => {
        setup({ usage: { rows: [usageRow('day-40', 'lumo-lite', 9_000_000, 0, 10_000_000)] } });

        expect(screen.queryByText('No API usage yet')).not.toBeInTheDocument();
        expect(getMetric('Balance used')).toContain('$0.00');
    });

    it('shows the first-request hint when there is no usage at all', () => {
        setup({ usage: { rows: [] } });

        expect(screen.getByText('No API usage yet')).toBeInTheDocument();
    });

    it('shows the usage loading', () => {
        setup({ usage: { isLoading: true, rows: [] } });

        expect(screen.getByText('Loading usage…')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
    });

    it('says when the usage could not be loaded', () => {
        setup({ usage: { error: true } });

        expect(screen.getByText('Could not load usage.')).toBeInTheDocument();
        expect(screen.queryByText('No API usage yet')).not.toBeInTheDocument();
    });

    it('reads the organization usage for an organization admin', () => {
        setup({ isOrgAdmin: true });

        expect(useApiUsageSummary).toHaveBeenCalledWith('organization');
    });

    it('does not estimate the organization runway from a member’s own usage', async () => {
        setup({ isOrgMember: true, creditResponse: Promise.resolve(MOCK_LUMO_CREDIT_RESPONSE) });

        expect(useApiUsageSummary).toHaveBeenCalledWith('self');
        expect(await screen.findByText('Usage estimate unavailable')).toBeInTheDocument();
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
        expect(csv.split('\n').at(-1)).toBe('"day-89","1500000","2000000","3.000000"');
        click.mockRestore();
    });

    it('opens the credits modal from Top up balance', () => {
        setup();

        expect(screen.queryByText('Credits modal')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Top up balance' }));

        expect(screen.getByText('Credits modal')).toBeInTheDocument();
    });

    it('opens the balance settings from Manage', async () => {
        setup({ creditResponse: Promise.resolve(MOCK_LUMO_CREDIT_RESPONSE), showAutoTopUp: true });

        fireEvent.click(await screen.findByRole('button', { name: 'Manage automatic top-up and spending limit' }));

        expect(screen.getByText('Balance settings')).toBeInTheDocument();
    });

    it('shows each member’s usage over the selected period to an organization admin', () => {
        setup({ isOrgAdmin: true });

        expect(screen.getByText('Member usage')).toBeInTheDocument();
        expect(useApiUsageMembers).toHaveBeenLastCalledWith('day-60', 'day-89');
        expect(screen.getByText('Alice').closest('article')).toHaveTextContent('Admin');
        expect(screen.getByText('Alice').closest('article')).toHaveTextContent('1.0M');
        expect(screen.getByText('Alice').closest('article')).toHaveTextContent('$2.50');
        expect(screen.getByText('Bob').closest('article')).toHaveTextContent('Member');
        expect(screen.getByText('Former members')).toBeInTheDocument();

        selectPeriod('Last 7 days');

        expect(useApiUsageMembers).toHaveBeenLastCalledWith('day-83', 'day-89');
    });

    it('shows API access and per-model usage as not available yet', () => {
        setup({ isOrgAdmin: true });

        const accessToggle = screen.getByLabelText('Toggle API access for Alice');
        expect(accessToggle).toBeDisabled();
        expect(accessToggle).not.toBeChecked();
        expect(screen.getByText('Alice').closest('article')).toHaveTextContent('Not available yet');
        expect(screen.getByRole('button', { name: 'Show usage details for Alice' })).toBeDisabled();
        expect(screen.getByText('Former members').closest('article')).not.toHaveTextContent('Not available yet');
    });

    it('filters the members by name', () => {
        setup({ isOrgAdmin: true });

        fireEvent.change(screen.getByLabelText('Search members'), { target: { value: 'bo' } });

        expect(screen.queryByText('Alice')).not.toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Search members'), { target: { value: 'nobody' } });

        expect(screen.getByText('No members match your search.')).toBeInTheDocument();
        expect(screen.queryByText('No member API usage yet')).not.toBeInTheDocument();
    });

    it('shows that member usage is loading, until the organization members are loaded too', () => {
        setup({ isOrgAdmin: true, isLoadingMembers: true });

        expect(within(getMembersSection()).getByText('Loading usage…')).toBeInTheDocument();
        expect(screen.queryByText('Unknown member')).not.toBeInTheDocument();
    });

    it('says when the member usage could not be loaded', () => {
        setup({ isOrgAdmin: true, memberUsage: { error: true, rows: [] } });

        expect(within(getMembersSection()).getByText('Could not load usage.')).toBeInTheDocument();
    });

    it('says when no member has used the API in the period', () => {
        setup({ isOrgAdmin: true, memberUsage: { rows: [] } });

        expect(screen.getByText('No member API usage yet')).toBeInTheDocument();
        expect(screen.queryByText('No members match your search.')).not.toBeInTheDocument();
    });

    it('hides the member usage from a non-admin', () => {
        setup();

        expect(screen.queryByText('Member usage')).not.toBeInTheDocument();
    });
});
