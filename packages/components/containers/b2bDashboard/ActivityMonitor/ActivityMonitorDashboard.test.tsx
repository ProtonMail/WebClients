import { render, screen } from '@testing-library/react';

import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

import ActivityMonitorDashboard from './ActivityMonitorDashboard';

jest.mock(
    './ActivityMonitorEvents',
    () =>
        function ActivityMonitorEvents() {
            return <div>account events</div>;
        }
);
jest.mock('../Organization/OrganizationEvents', () => ({ OrganizationEvents: () => <div>organization events</div> }));
jest.mock('../Pass/PassEvents', () => ({ PassEvents: () => <div>pass events</div> }));
jest.mock('../VPN/VPNEvents', () => ({ VPNEvents: () => <div>vpn events</div> }));
jest.mock(
    '../../account/SettingsSectionExtraWide',
    () =>
        function SettingsSectionExtraWide({ children }: { children: React.ReactNode }) {
            return <div>{children}</div>;
        }
);

const organizationWithoutSetup = { Name: '', RequiresKey: 0, HasKeys: 0 } as OrganizationExtended;
const organizationWithKeys = { Name: 'Example organization', RequiresKey: 1, HasKeys: 1 } as OrganizationExtended;

const buildEntitlements = (checks: Partial<EntitlementChecksForOrgAndUser>) =>
    ({
        isB2B: false,
        hasPassActivityMonitor: false,
        hasVpnActivityMonitor: false,
        ...checks,
    }) as EntitlementChecksForOrgAndUser;

describe('ActivityMonitorDashboard', () => {
    it('shows only the account events to a business organization that is not set up yet', () => {
        render(
            <ActivityMonitorDashboard
                organization={organizationWithoutSetup}
                entitlements={buildEntitlements({ isB2B: true })}
            />
        );

        expect(screen.getByText('account events')).toBeInTheDocument();
        expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });

    it('shows the Pass tab to a set-up organization with the Pass activity monitor, such as a Pass Professional subsidiary', () => {
        render(
            <ActivityMonitorDashboard
                organization={organizationWithKeys}
                entitlements={buildEntitlements({ isB2B: true, hasPassActivityMonitor: true })}
            />
        );

        expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
            'Accounts',
            'Organization',
            'Proton Pass',
        ]);
    });

    it('shows nothing to an organization that is neither set up nor a business', () => {
        render(
            <ActivityMonitorDashboard organization={organizationWithoutSetup} entitlements={buildEntitlements({})} />
        );

        expect(screen.queryByText('account events')).not.toBeInTheDocument();
        expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });
});
