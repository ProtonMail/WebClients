import { MemoryRouter } from 'react-router-dom';

import { render, screen, waitFor } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';
import { DARK_WEB_MONITORING_ELIGIBILITY_STATE } from '@proton/shared/lib/interfaces/UserSettings';
import { buildUser } from '@proton/shared/testing/buildUser';

import CredentialLeakSection from './CredentialLeakSection';

const mockApi = vi.fn();

vi.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }));
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));
vi.mock('@proton/account/user/hooks', () => ({ useUser: vi.fn() }));
vi.mock('@proton/account/userSettings/hooks', () => ({ useUserSettings: vi.fn() }));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => true }));
vi.mock('./DWMUpgrade', () => ({ default: () => <button type="button">Upgrade</button> }));

const renderSection = ({ isPaid, eligible }: { isPaid: boolean; eligible: boolean }) => {
    vi.mocked(useUser).mockReturnValue([
        buildUser({ Subscribed: isPaid ? 8 : 0, isPaid, isFree: !isPaid }),
        false,
    ] as any);
    vi.mocked(useUserSettings).mockReturnValue([
        {
            BreachAlerts: {
                Eligible: eligible ? DARK_WEB_MONITORING_ELIGIBILITY_STATE.PAID : 0,
                Value: 0,
                EmailNotifications: 1,
            },
        } as any,
        false,
        undefined,
    ] as any);
    render(
        <MemoryRouter>
            <CredentialLeakSection />
        </MemoryRouter>
    );
};

describe('CredentialLeakSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApi.mockResolvedValue({ Breaches: [], Samples: [], IsEligible: false, Count: 0 });
    });

    it('shows the monitoring toggle to eligible paid users', async () => {
        renderSection({ isPaid: true, eligible: true });

        expect(await screen.findByText(`Enable ${DARK_WEB_MONITORING_NAME}`)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Upgrade' })).not.toBeInTheDocument();
    });

    it('offers an upgrade instead of the toggles to paid users whose plan does not include it', async () => {
        renderSection({ isPaid: true, eligible: false });

        expect(await screen.findByRole('button', { name: 'Upgrade' })).toBeInTheDocument();
        expect(screen.queryByText(`Enable ${DARK_WEB_MONITORING_NAME}`)).not.toBeInTheDocument();
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('keeps the free user upsell', async () => {
        renderSection({ isPaid: false, eligible: false });

        await waitFor(() => expect(screen.getByText(`Enable ${DARK_WEB_MONITORING_NAME}`)).toBeInTheDocument());
        expect(screen.queryByRole('button', { name: 'Upgrade' })).not.toBeInTheDocument();
    });
});
