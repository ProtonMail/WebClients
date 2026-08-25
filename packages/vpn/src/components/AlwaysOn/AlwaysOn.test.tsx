import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PLANS } from '@proton/payments/core/constants';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { TelemetryVpnAlwaysOnPolicyEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { buildSubscription } from '@proton/testing/builders/subscription';

import type { AlwaysOnPolicy } from '../../types/AlwaysOn';
import { AlwaysOn } from './AlwaysOn';

const fetchPolicy = vi.fn();
const updatePolicy = vi.fn();
const service = { fetchPolicy, updatePolicy };

vi.mock('@proton/app-context/useApi', () => ({ useApi: vi.fn() }));
vi.mock('@proton/shared/lib/helpers/metrics', () => ({ sendTelemetryReport: vi.fn() }));
vi.mock('../../services/alwaysOnPolicyService', () => ({
    getAlwaysOnPolicyService: () => service,
}));

const flagMock = vi.fn();
vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => flagMock(),
    default: () => flagMock(),
}));

const variantMock = vi.fn();
vi.mock('@proton/unleash/useVariant', () => ({
    useVariant: () => variantMock(),
}));

const downloadLinksMock = vi.fn();
vi.mock('../../hooks/useFetchDownloadLinks', () => ({
    useFetchDownloadLinks: () => downloadLinksMock(),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
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
        variantMock.mockReturnValue({ name: 'version', enabled: true, payload: { type: 'string', value: '5.3.0' } });
        downloadLinksMock.mockReturnValue({
            windows: [
                {
                    title: () => 'Windows 10/11 (x64)',
                    link: 'https://protonvpn.com/download/ProtonVPN_v5.3.0_x64.exe',
                },
            ],
        });
        fetchPolicy.mockResolvedValue(null);
        updatePolicy.mockResolvedValue(buildPolicy());
        subscriptionMock.mockReturnValue([buildSubscription(PLANS.VPN_BUSINESS), false]);
    });

    it('shows a loader while the subscription is loading', () => {
        subscriptionMock.mockReturnValue([undefined, true]);

        const { container } = render(<AlwaysOn />);

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
        expect(screen.getByRole('button', { name: 'Configure Always-on VPN' })).toBeEnabled();
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

    it('offers both architectures of the version named by the B2BAlwaysOnWindowsRelease variant payload', async () => {
        fetchPolicy.mockResolvedValue(buildPolicy());

        render(<AlwaysOn />);
        await screen.findByText('Always-on VPN device profile');
        await userEvent.click(screen.getByRole('button', { name: 'Instructions' }));

        expect(await screen.findByText(/running Proton VPN desktop version 5\.3\.0 or later/)).toBeInTheDocument();

        await userEvent.click(screen.getByText('Download latest'));

        expect(screen.getByText('Windows 10/11 (x64)').closest('a')).toHaveAttribute(
            'href',
            'https://protonvpn.com/download/ProtonVPN_v5.3.0_x64.exe'
        );
        expect(screen.getByText('Windows 10/11 (ARM64)').closest('a')).toHaveAttribute(
            'href',
            'https://protonvpn.com/download/ProtonVPN_v5.3.0_arm64.exe'
        );
    });

    it('reports the call to action and the build the admin picks separately', async () => {
        fetchPolicy.mockResolvedValue(buildPolicy());

        render(<AlwaysOn />);
        await screen.findByText('Always-on VPN device profile');
        await userEvent.click(screen.getByRole('button', { name: 'Instructions' }));
        await screen.findByText(/running Proton VPN desktop version 5\.3\.0 or later/);

        await userEvent.click(screen.getByText('Download latest'));

        expect(sendTelemetryReport).toHaveBeenCalledWith(
            expect.objectContaining({
                event: TelemetryVpnAlwaysOnPolicyEvents.downloadLatestClicked,
                dimensions: { source: 'build', version: '5.3.0' },
            })
        );
        expect(sendTelemetryReport).not.toHaveBeenCalledWith(
            expect.objectContaining({ event: TelemetryVpnAlwaysOnPolicyEvents.clientDownloadClicked })
        );

        await userEvent.click(screen.getByText('Windows 10/11 (x64)'));

        expect(sendTelemetryReport).toHaveBeenCalledWith(
            expect.objectContaining({
                event: TelemetryVpnAlwaysOnPolicyEvents.clientDownloadClicked,
                dimensions: { source: 'build', version: '5.3.0' },
            })
        );
    });

    it('leaves the minimum client version out when the release flag has no payload', async () => {
        variantMock.mockReturnValue({ name: 'disabled', enabled: false });
        fetchPolicy.mockResolvedValue(buildPolicy());

        render(<AlwaysOn />);
        await screen.findByText('Always-on VPN device profile');
        await userEvent.click(screen.getByRole('button', { name: 'Instructions' }));

        await screen.findAllByText('Choose a deployment method');
        expect(screen.queryByText(/or later/)).not.toBeInTheDocument();
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
