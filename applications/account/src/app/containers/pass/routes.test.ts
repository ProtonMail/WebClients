import { PLANS } from '@proton/payments/core/constants';

import {
    buildOrganizationRouterParams,
    buildOrganizationWithKeys,
    permissionsWithout,
} from '../../content/testing/buildOrganizationRouterParams';
import { getPassAppRoutes } from './routes';

type PassRoutesInput = Parameters<typeof buildOrganizationRouterParams>[0];

const getPassBadgeRoutes = (input: PassRoutesInput) => {
    const { activityLogs, policies, reports } = getPassAppRoutes(buildOrganizationRouterParams(input)).routes;

    return {
        activityLogs: { available: activityLogs.available, upgradeRequired: activityLogs.upgradeRequired },
        policies: { available: policies.available, upgradeRequired: policies.upgradeRequired },
        reports: { available: reports.available, upgradeRequired: reports.upgradeRequired },
    };
};

describe('getPassAppRoutes', () => {
    it('shows Activity log, Policies and Reports with an upgrade badge to a Pass Pro organization', () => {
        expect(getPassBadgeRoutes({ plan: PLANS.PASS_PRO })).toEqual({
            activityLogs: { available: true, upgradeRequired: true },
            policies: { available: true, upgradeRequired: true },
            reports: { available: true, upgradeRequired: true },
        });
    });

    it('shows Activity log, Policies and Reports without an upgrade badge to a Pass Business organization', () => {
        expect(getPassBadgeRoutes({ plan: PLANS.PASS_BUSINESS })).toEqual({
            activityLogs: { available: true, upgradeRequired: false },
            policies: { available: true, upgradeRequired: false },
            reports: { available: true, upgradeRequired: false },
        });
    });

    it('hides the Pass pages from a VPN Business organization that has no Pass', () => {
        expect(getPassBadgeRoutes({ plan: PLANS.VPN_BUSINESS })).toEqual({
            activityLogs: { available: false, upgradeRequired: true },
            policies: { available: false, upgradeRequired: false },
            reports: { available: false, upgradeRequired: false },
        });
    });

    it('shows Policies and Reports without an upgrade badge to an MSP subsidiary that has no Pass entitlements', () => {
        const subsidiary = buildOrganizationWithKeys({ PlanName: PLANS.PASS_PRO, IsSubsidiary: true });

        expect(getPassBadgeRoutes({ organization: subsidiary })).toEqual({
            activityLogs: { available: false, upgradeRequired: true },
            policies: { available: true, upgradeRequired: false },
            reports: { available: true, upgradeRequired: false },
        });
    });

    it('shows every Pass page without an upgrade badge to a Pass Professional MSP subsidiary that cannot read its subscription', () => {
        const subsidiary = buildOrganizationWithKeys({ PlanName: PLANS.PASS_BUSINESS, IsSubsidiary: true });

        expect(getPassBadgeRoutes({ plan: PLANS.PASS_BUSINESS, organization: subsidiary })).toEqual({
            activityLogs: { available: true, upgradeRequired: false },
            policies: { available: true, upgradeRequired: false },
            reports: { available: true, upgradeRequired: false },
        });
    });

    it.each([
        { route: 'activityLogs', missingPermission: 'account.activity_log.read' },
        { route: 'policies', missingPermission: 'pass.policy.read' },
        { route: 'reports', missingPermission: 'pass.report.read' },
    ] as const)(
        'hides $route from a Pass Business admin without $missingPermission',
        ({ route, missingPermission }) => {
            const badgeRoutes = getPassBadgeRoutes({
                plan: PLANS.PASS_BUSINESS,
                permissions: permissionsWithout(missingPermission),
            });

            expect(badgeRoutes[route].available).toBe(false);
        }
    );
});
