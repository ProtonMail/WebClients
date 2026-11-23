import type { ReactNode } from 'react';

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useMembers } from '@proton/account/members/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useApi } from '@proton/app-context/useApi';
import { MOCK_LUMO_CREDIT_RESPONSE } from '@proton/payments/testing/lumo-credit';
import { MEMBER_ROLE } from '@proton/shared/lib/constants';

import { ApiUsageDashboard } from './ApiUsageDashboard';
import { useApiUsageMembers } from './useApiUsageMembers';
import { useApiUsageSummary } from './useApiUsageSummary';
import { useMembersLumoApi } from './useMembersLumoApi';

vi.mock('@proton/account/paymentStatus/hooks');
vi.mock('@proton/app-context/useApi');
vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-lumo' }) }));
vi.mock('./ApiTokenUsageChart', () => ({
    ApiTokenUsageChart: ({ days }: { days: { apiInputTokens: number; chatInputTokens?: number }[] }) => (
        <div data-testid="token-usage-chart" data-days={days.length}>
            {days.reduce((sum, day) => sum + day.apiInputTokens + (day.chatInputTokens ?? 0), 0)}
        </div>
    ),
}));
vi.mock('@proton/components/components/link/SettingsLink', () => ({
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <a href="/users-addresses">{children}</a>,
}));
vi.mock('@proton/payments-ui/ui/containers/LumoCreditsModal', () => ({
    LumoCreditsModal: ({ open }: { open: boolean }) => (open ? <div>Credits modal</div> : null),
}));

vi.mock('./useApiUsageSummary');
vi.mock('./useApiUsageMembers');
vi.mock('./useMembersLumoApi');
vi.mock('@proton/account/members/hooks');
vi.mock('@proton/account/organization/hooks');

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
const modelUsage = (model: string, inputTokens: number, outputTokens: number, costMicros: number | null) => ({
    ClientType: 'api',
    Model: model,
    InputTokens: inputTokens,
    OutputTokens: outputTokens,
    Calls: 1,
    CostMicros: costMicros,
});
const memberUsageRows = [
    {
        MemberID: 'member-alice',
        Totals: memberTotals(1_000_000, 2_500_000),
        Usage: [modelUsage('lumo-lite', 600_000, 25_000, 1_000_000), modelUsage('lumo-max', 400_000, 0, null)],
    },
    { MemberID: 'member-bob', Totals: memberTotals(500_000, 1_250_000), Usage: [] },
    { MemberID: null, Totals: memberTotals(100_000, 250_000), Usage: [] },
];

const setApiAccess = vi.fn();
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
    apiAccess = {},
    isOrganizationApiEnabled = true,
    isLoadingOrganization = false,
    members = organizationMembers,
}: {
    isOrgAdmin?: boolean;
    isOrgMember?: boolean;
    creditResponse?: Promise<unknown>;
    showAutoTopUp?: boolean;
    usage?: { isLoading?: boolean; error?: boolean; rows?: ReturnType<typeof usageRow>[] };
    memberUsage?: { isLoading?: boolean; error?: boolean; rows?: typeof memberUsageRows };
    isLoadingMembers?: boolean;
    apiAccess?: { error?: boolean; enabledByMemberId?: Record<string, boolean> };
    isOrganizationApiEnabled?: boolean;
    isLoadingOrganization?: boolean;
    members?: typeof organizationMembers;
} = {}) => {
    setApiAccess.mockReset().mockResolvedValue(undefined);
    (useMembersLumoApi as Mock).mockReturnValue({
        enabledByMemberId: { 'member-alice': true, 'member-bob': false },
        error: false,
        setApiAccess,
        ...apiAccess,
    });
    (useOrganization as Mock).mockReturnValue([
        isLoadingOrganization ? undefined : { Settings: { LumoApiEnabled: isOrganizationApiEnabled } },
        isLoadingOrganization,
    ]);
    (useApi as Mock).mockReturnValue(vi.fn(() => creditResponse));
    (useApiUsageSummary as Mock).mockReturnValue({
        dates: usageDates,
        rows: usageRows,
        isLoading: false,
        error: false,
        ...usage,
    });
    (useApiUsageMembers as Mock).mockReturnValue({
        rows: memberUsageRows,
        isLoading: false,
        error: false,
        ...memberUsage,
    });
    (useMembers as Mock).mockReturnValue([members, isLoadingMembers]);
    (usePaymentStatus as Mock).mockReturnValue([{ CountryCode: 'DE', VendorStates: {} }, false]);
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
        expect(getMetric('Balance used')).toBe('Balance used7.5 creditsEstimated spend');
        expect(getMetric('Input tokens')).toContain('3.5M');
        expect(getMetric('Output tokens')).toContain('3.0M');
        expect(screen.getByTestId('token-usage-chart')).toHaveAttribute('data-days', '30');
        expect(screen.getByRole('group', { name: 'lumo-max' })).toHaveTextContent('4.5 credits');
    });

    it('updates the usage for the selected period', () => {
        setup();

        selectPeriod('Last 7 days');

        expect(screen.getByTestId('token-usage-chart')).toHaveAttribute('data-days', '7');
        expect(getMetric('Balance used')).toBe('Balance used3 creditsEstimated spend');

        selectPeriod('Previous 30 days');

        expect(getMetric('Balance used')).toBe('Balance used10 creditsEstimated spend');
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

        expect(screen.getByTestId('token-usage-chart').textContent?.replace(/\s+/g, ' ')).toMatch(/^50000$/);
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
        expect(getMetric('Balance used')).toBe('Balance used0 creditsEstimated spend');
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
        const createObjectURL = vi.fn((_: Blob) => 'blob:usage');
        URL.createObjectURL = createObjectURL;
        URL.revokeObjectURL = vi.fn();
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        setup();

        fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

        expect(click).toHaveBeenCalledTimes(1);
        const csv = await createObjectURL.mock.calls[0][0].text();
        expect(csv.split('\n')[0]).toBe('"date","input_tokens","output_tokens","credits_used"');
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
        expect(screen.getByText('Alice').closest('article')).toHaveTextContent('2.5 credits');
        expect(screen.getByText('Bob').closest('article')).toHaveTextContent('Member');
        expect(screen.getByText('Former members')).toBeInTheDocument();

        selectPeriod('Last 7 days');

        expect(useApiUsageMembers).toHaveBeenLastCalledWith('day-83', 'day-89');
    });

    it('shows and changes each current member’s API access', () => {
        setup({ isOrgAdmin: true });

        expect(screen.getByLabelText('Toggle API access for Alice')).toBeChecked();
        expect(screen.getByLabelText('Toggle API access for Bob')).not.toBeChecked();
        expect(screen.getByLabelText('Toggle API access for Bob')).toBeEnabled();
        expect(screen.queryByLabelText('Toggle API access for Former members')).not.toBeInTheDocument();

        fireEvent.click(screen.getByLabelText('Toggle API access for Bob'));

        expect(setApiAccess).toHaveBeenCalledWith('member-bob', true);

        fireEvent.click(screen.getByLabelText('Toggle API access for Alice'));

        expect(setApiAccess).toHaveBeenCalledWith('member-alice', false);
    });

    it.each([
        [
            'the organization has the Lumo API off',
            { isOrganizationApiEnabled: false },
            'Turn on the Lumo API for your organization first.',
        ],
        [
            'it could not be loaded',
            { apiAccess: { error: true, enabledByMemberId: {} } },
            'API access could not be loaded.',
        ],
    ])('disables API access when %s', (_, options, hint) => {
        setup({ isOrgAdmin: true, ...options });

        const accessToggle = screen.getByLabelText('Toggle API access for Alice');
        expect(accessToggle).toBeDisabled();
        expect(accessToggle.closest('[title]')).toHaveAttribute('title', hint);
    });

    it('shows a member’s usage per model on demand', () => {
        setup({ isOrgAdmin: true });
        const alice = screen.getByText('Alice').closest('article') as HTMLElement;
        const details = screen.getByRole('button', { name: 'Show usage details for Alice' });

        expect(details).toHaveAttribute('aria-expanded', 'false');
        expect(within(alice).queryByRole('group', { name: 'lumo-lite' })).not.toBeInTheDocument();

        fireEvent.click(details);

        expect(details).toHaveAttribute('aria-expanded', 'true');
        const liteUsage = within(alice).getByRole('group', { name: 'lumo-lite' });
        expect(liteUsage.textContent?.replace(/\s+/g, ' ')).toMatch(
            /Input600\.0k.*Output25\.0k.*Balance used1 credit(?!s)/
        );
        expect(within(alice).getByRole('group', { name: 'lumo-max' })).toHaveTextContent('Not priced yet');

        fireEvent.click(details);

        expect(within(alice).queryByRole('group', { name: 'lumo-lite' })).not.toBeInTheDocument();
    });

    it('offers usage per model only for a member who used a model', () => {
        setup({ isOrgAdmin: true });

        expect(screen.getByRole('button', { name: 'Show usage details for Alice' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Show usage details for Bob' })).toBeDisabled();
    });

    it('closes a member’s usage per model when the member no longer has any', () => {
        setup({ isOrgAdmin: true });
        const details = screen.getByRole('button', { name: 'Show usage details for Alice' });
        fireEvent.click(details);
        (useApiUsageMembers as Mock).mockReturnValue({
            rows: memberUsageRows.map((row) => ({ ...row, Usage: [] })),
            isLoading: false,
            error: false,
        });

        selectPeriod('Last 7 days');

        expect(details).toHaveAttribute('aria-expanded', 'false');
        expect(
            within(screen.getByText('Alice').closest('article') as HTMLElement).queryByRole('group', {
                name: 'lumo-lite',
            })
        ).not.toBeInTheDocument();
    });

    it('disables API access for a member whose access is not known', () => {
        setup({ isOrgAdmin: true, apiAccess: { enabledByMemberId: {} } });

        expect(screen.getByLabelText('Toggle API access for Alice')).toBeDisabled();
    });

    it('keeps the API access toggle busy until the change is saved', async () => {
        let resolveSave: () => void = () => {};
        setup({ isOrgAdmin: true });
        setApiAccess.mockReturnValueOnce(new Promise<void>((resolve) => (resolveSave = resolve)));

        fireEvent.click(screen.getByLabelText('Toggle API access for Bob'));

        expect(screen.getByLabelText('Toggle API access for Bob')).toBeDisabled();
        await act(async () => resolveSave());
        expect(screen.getByLabelText('Toggle API access for Bob')).toBeEnabled();
    });

    it('waits for the organization before showing member usage', () => {
        setup({ isOrgAdmin: true, isLoadingOrganization: true });

        expect(within(getMembersSection()).getByText('Loading usage…')).toBeInTheDocument();
        expect(screen.queryByText(/Turn on the Lumo API/)).not.toBeInTheDocument();
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

    it('lists every member, at zero, so their API access can be changed before they use the API', () => {
        setup({ isOrgAdmin: true, memberUsage: { rows: [] } });

        expect(screen.getByText('Alice').closest('article')).toHaveTextContent('0 credits');
        expect(screen.getByLabelText('Toggle API access for Bob')).toBeEnabled();
        expect(screen.queryByText('No member API usage yet')).not.toBeInTheDocument();
    });

    it('says when there is no member and no usage', () => {
        setup({ isOrgAdmin: true, memberUsage: { rows: [] }, members: [] });

        expect(screen.getByText('No member API usage yet')).toBeInTheDocument();
        expect(screen.queryByText('No members match your search.')).not.toBeInTheDocument();
    });

    it('hides the member usage from a non-admin', () => {
        setup();

        expect(screen.queryByText('Member usage')).not.toBeInTheDocument();
    });
});
