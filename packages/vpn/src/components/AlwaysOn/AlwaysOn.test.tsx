import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PLANS } from '@proton/payments/core/constants';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { buildSubscription } from '@proton/testing/builders/subscription';

import type { AlwaysOnPolicy } from '../../types/AlwaysOn';
import { AlwaysOn } from './AlwaysOn';

const fetchPolicy = vi.fn();
const updatePolicy = vi.fn();
const service = { fetchPolicy, updatePolicy };

vi.mock('@proton/components/hooks/useApi', () => ({ default: vi.fn() }));
vi.mock('../../services/alwaysOnPolicyService', () => ({
    getAlwaysOnPolicyService: () => service,
}));

const flagMock = vi.fn();
vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => flagMock(),
    default: () => flagMock(),
}));

vi.mock('@proton/components/hooks/useNotifications', () => ({
    default: () => ({ createNotification: vi.fn() }),
}));

const subscriptionMock = vi.fn<() => [MaybeFreeSubscription, boolean]>();
vi.mock('@proton/account/subscription/hooks', () => ({
    useSubscription: () => subscriptionMock(),
}));

vi.mock('@proton/account/user/hooks', () => ({
    useUser: () => [{ isAdmin: true, isSelf: true }],
}));

vi.mock('@proton/components/containers/payments/subscription/SubscriptionModalProvider', () => ({
    useSubscriptionModalRaw: () => vi.fn(),
}));

const buildPolicy = (overrides: Partial<AlwaysOnPolicy> = {}): AlwaysOnPolicy => ({
    ID: 'policy-1',
    EnforceAlwaysOn: true,
    Version: 1,
    Hash: 'a'.repeat(64),
    UpdatedAt: 1_750_000_000,
    CreatorUserID: 'user-1',
    Artifacts: {
        windows: { Filename: 'protonvpn-install-abc.ps1', Content: '# installer' },
        rego: { Filename: 'protonvpn-deviceprofile.rego', Content: 'package protonvpn' },
    },
    ...overrides,
});

describe('AlwaysOn', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        flagMock.mockReturnValue(true);
        fetchPolicy.mockResolvedValue(null);
        updatePolicy.mockResolvedValue(buildPolicy());
        subscriptionMock.mockReturnValue([buildSubscription(PLANS.VPN_BUSINESS), false]);
    });

    it('shows a loader while the subscription is loading', () => {
        subscriptionMock.mockReturnValue([undefined, true]);

        const { container } = render(<AlwaysOn />);

        // the subscription <Loader /> renders a small circle-loader; the policy loader is large
        expect(container.querySelector('.circle-loader.is-small')).toBeInTheDocument();
        expect(container.querySelector('.circle-loader.is-large')).not.toBeInTheDocument();
        expect(screen.queryByText('Available on VPN Professional')).not.toBeInTheDocument();
        expect(screen.queryByText('Ensure your organization is always protected')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Configure Always-on VPN' })).not.toBeInTheDocument();
    });

    it('renders nothing when the feature flag is off', () => {
        flagMock.mockReturnValue(false);

        const { container } = render(<AlwaysOn />);

        expect(container).toBeEmptyDOMElement();
    });

    it('shows the upgrade view for VPN Essentials', () => {
        subscriptionMock.mockReturnValue([buildSubscription(PLANS.VPN_PRO), false]);

        render(<AlwaysOn />);

        expect(screen.getByText('Available on VPN Professional')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Upgrade to Professional' })).toBeInTheDocument();
    });

    it('shows the call-to-action when no policy is configured', async () => {
        fetchPolicy.mockResolvedValue(null);

        render(<AlwaysOn />);

        expect(await screen.findByText('Ensure your organization is always protected')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Configure Always-on VPN' })).toBeInTheDocument();
    });

    test.each`
        enforceAlwaysOn | status
        ${true}         | ${'Enabled'}
        ${false}        | ${'Disabled'}
    `(
        'shows the overview reflecting the policy when EnforceAlwaysOn is $enforceAlwaysOn',
        async ({ enforceAlwaysOn, status }) => {
            fetchPolicy.mockResolvedValue(buildPolicy({ EnforceAlwaysOn: enforceAlwaysOn }));

            render(<AlwaysOn />);

            expect(await screen.findByText('Always-on VPN device profile')).toBeInTheDocument();
            expect(screen.getByText(status)).toBeInTheDocument();
            expect(screen.getByText('No restrictions')).toBeInTheDocument();
        }
    );

    it('opens the deployment instructions from the overview', async () => {
        fetchPolicy.mockResolvedValue(buildPolicy());

        render(<AlwaysOn />);
        await screen.findByText('Always-on VPN device profile');

        await userEvent.click(screen.getByRole('button', { name: 'Instructions' }));

        expect(await screen.findAllByText('Choose a deployment method')).not.toHaveLength(0);
    });

    it('runs the create flow and commits the policy to the page when the modal reaches the instructions step', async () => {
        render(<AlwaysOn />);

        await userEvent.click(await screen.findByRole('button', { name: 'Configure Always-on VPN' }));
        await userEvent.click(await screen.findByText('Generate device profile'));

        expect(updatePolicy).toHaveBeenCalledWith({ EnforceAlwaysOn: true });

        expect(await screen.findAllByText('Choose a deployment method', undefined, { timeout: 3000 })).not.toHaveLength(
            0
        );
        expect(screen.getByText('Done')).toBeInTheDocument();
        expect(screen.getByText('Always-on VPN device profile')).toBeInTheDocument();
    });

    it('keeps showing the call-to-action when the policy fetch fails', async () => {
        fetchPolicy.mockRejectedValue(new Error('network'));

        render(<AlwaysOn />);

        expect(await screen.findByText('Ensure your organization is always protected')).toBeInTheDocument();
    });
});
