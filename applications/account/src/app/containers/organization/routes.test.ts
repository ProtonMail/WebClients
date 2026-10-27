import type { SubSectionConfig } from '@proton/components/containers/layout/interface';
import { PLANS } from '@proton/payments/core/constants';
import { APPS, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { GroupFlags } from '@proton/shared/lib/interfaces/Group';

import {
    buildGroup,
    buildOrganizationRouterParams,
    buildOrganizationWithKeys,
    defaultFlags,
    permissionsWithout,
} from '../../content/testing/buildOrganizationRouterParams';
import { getOrganizationAppRoutes } from './routes';

type OrganizationRoutesInput = Parameters<typeof buildOrganizationRouterParams>[0];

const getPassBadgeRoutes = (input: OrganizationRoutesInput) => {
    const { groups, activityMonitor } = getOrganizationAppRoutes(buildOrganizationRouterParams(input)).routes;

    return {
        groups: { available: groups.available, upgradeRequired: groups.upgradeRequired },
        activityMonitor: { available: activityMonitor.available, upgradeRequired: activityMonitor.upgradeRequired },
    };
};

const getRoutes = (input: OrganizationRoutesInput) =>
    getOrganizationAppRoutes(buildOrganizationRouterParams(input)).routes;

const findSubsection = (subsections: SubSectionConfig[] | undefined, id: string) =>
    subsections?.find((subsection) => subsection.id === id);

const mspSubsidiary = buildOrganizationWithKeys({ PlanName: PLANS.PASS_PRO, IsSubsidiary: true });

describe('getOrganizationAppRoutes', () => {
    it('shows Groups and Activity monitor with an upgrade badge to a Pass Pro organization without groups', () => {
        expect(getPassBadgeRoutes({ plan: PLANS.PASS_PRO })).toEqual({
            groups: { available: true, upgradeRequired: true },
            activityMonitor: { available: true, upgradeRequired: true },
        });
    });

    it('shows Groups and Activity monitor without an upgrade badge to a Pass Business organization', () => {
        expect(getPassBadgeRoutes({ plan: PLANS.PASS_BUSINESS })).toEqual({
            groups: { available: true, upgradeRequired: false },
            activityMonitor: { available: true, upgradeRequired: false },
        });
    });

    it('shows Activity monitor without a Pass upgrade badge to a VPN Business organization', () => {
        expect(getPassBadgeRoutes({ plan: PLANS.VPN_BUSINESS })).toEqual({
            groups: { available: true, upgradeRequired: false },
            activityMonitor: { available: true, upgradeRequired: false },
        });
    });

    it('shows Activity monitor without an upgrade badge to a Pass Professional MSP subsidiary that cannot read its subscription', () => {
        const subsidiary = buildOrganizationWithKeys({ PlanName: PLANS.PASS_BUSINESS, IsSubsidiary: true });

        expect(getPassBadgeRoutes({ plan: PLANS.PASS_BUSINESS, organization: subsidiary }).activityMonitor).toEqual({
            available: true,
            upgradeRequired: false,
        });
    });

    it('shows Activity monitor without an upgrade badge to an MSP subsidiary that has no Pass entitlements', () => {
        const subsidiary = buildOrganizationWithKeys({ PlanName: PLANS.PASS_PRO, IsSubsidiary: true });

        expect(getPassBadgeRoutes({ organization: subsidiary })).toEqual({
            groups: { available: false, upgradeRequired: true },
            activityMonitor: { available: true, upgradeRequired: false },
        });
    });

    it('shows Activity monitor to a business organization that is not set up yet', () => {
        const organizationWithoutSetup = buildOrganizationWithKeys({ RequiresKey: 0, HasKeys: 0, Name: '' });

        expect(
            getPassBadgeRoutes({ plan: PLANS.PASS_PRO, organization: organizationWithoutSetup }).activityMonitor
        ).toEqual({
            available: true,
            upgradeRequired: true,
        });
    });

    it('hides Activity monitor from an organization that is neither set up nor a business', () => {
        const organizationWithoutSetup = buildOrganizationWithKeys({ RequiresKey: 0, HasKeys: 0, Name: '' });

        expect(getPassBadgeRoutes({ organization: organizationWithoutSetup }).activityMonitor.available).toBe(false);
    });

    it('drops the Groups upgrade badge for a Pass Pro organization that already has a group', () => {
        const groups = [buildGroup(GroupFlags.System), buildGroup(GroupFlags.None)];

        expect(getPassBadgeRoutes({ plan: PLANS.PASS_PRO, groups }).groups).toEqual({
            available: true,
            upgradeRequired: false,
        });
    });

    it('keeps the Groups upgrade badge for a Pass Pro organization that only has a system group', () => {
        const groups = [buildGroup(GroupFlags.System)];

        expect(getPassBadgeRoutes({ plan: PLANS.PASS_PRO, groups }).groups).toEqual({
            available: true,
            upgradeRequired: true,
        });
    });

    it.each([
        { route: 'groups', missingPermission: 'account.group.read' },
        { route: 'activityMonitor', missingPermission: 'account.activity_log.read' },
    ] as const)('hides $route from a Pass Pro admin without $missingPermission', ({ route, missingPermission }) => {
        const badgeRoutes = getPassBadgeRoutes({
            plan: PLANS.PASS_PRO,
            permissions: permissionsWithout(missingPermission),
        });

        expect(badgeRoutes[route].available).toBe(false);
    });
});

describe('Always-on VPN route', () => {
    const alwaysOnVpnFlags = { ...defaultFlags, isAlwaysOnVpnEnabled: true };

    const getAlwaysOnVpnAvailability = (input: OrganizationRoutesInput) => getRoutes(input).alwaysOnVpn.available;

    it.each([PLANS.VPN_BUSINESS, PLANS.VPN_PRO, PLANS.BUNDLE_PRO_2024] as const)(
        'is available to a %s organization',
        (plan) => {
            expect(getAlwaysOnVpnAvailability({ plan, flags: alwaysOnVpnFlags })).toBe(true);
        }
    );

    it.each([PLANS.PASS_BUSINESS, PLANS.MAIL_PRO] as const)(
        'is hidden from a %s organization without a VPN business plan',
        (plan) => {
            expect(getAlwaysOnVpnAvailability({ plan, flags: alwaysOnVpnFlags })).toBe(false);
        }
    );

    it('is hidden from a VPN Business organization when the feature flag is off', () => {
        expect(getAlwaysOnVpnAvailability({ plan: PLANS.VPN_BUSINESS, flags: defaultFlags })).toBe(false);
    });

    it('is hidden from a VPN Business admin without the always-on read permission', () => {
        expect(
            getAlwaysOnVpnAvailability({
                plan: PLANS.VPN_BUSINESS,
                flags: alwaysOnVpnFlags,
                permissions: permissionsWithout('account.always_on.read'),
            })
        ).toBe(false);
    });
});

describe('multi-user pages', () => {
    const getMultiUserPages = (input: OrganizationRoutesInput) => {
        const { users, orgKeys, accessControl } = getRoutes({
            app: APPS.PROTONMAIL,
            flags: { ...defaultFlags, isScribeEnabled: true },
            ...input,
        });

        return {
            usersAndAddresses: users.available,
            organizationKey: findSubsection(orgKeys.subsections, 'password-keys')?.available,
            scribeFeatureAccess: findSubsection(accessControl.subsections, 'feature-access')?.available,
        };
    };

    it.each([PLANS.MAIL_PRO, PLANS.FAMILY] as const)(
        'shows Users and addresses, the Organization key and Scribe to an active %s organization',
        (plan) => {
            expect(getMultiUserPages({ plan })).toEqual({
                usersAndAddresses: true,
                organizationKey: true,
                scribeFeatureAccess: true,
            });
        }
    );

    it('hides Users and addresses, the Organization key and Scribe from a Mail Plus organization', () => {
        expect(getMultiUserPages({ plan: PLANS.MAIL })).toEqual({
            usersAndAddresses: false,
            organizationKey: false,
            scribeFeatureAccess: false,
        });
    });

    it('hides Scribe from a multi-user Pass Business organization whose plan does not support Scribe', () => {
        expect(getMultiUserPages({ plan: PLANS.PASS_BUSINESS })).toEqual({
            usersAndAddresses: true,
            organizationKey: true,
            scribeFeatureAccess: false,
        });
    });

    it('hides Scribe from a Mail Essentials organization when the Scribe flag is off', () => {
        expect(getMultiUserPages({ plan: PLANS.MAIL_PRO, flags: defaultFlags }).scribeFeatureAccess).toBe(false);
    });

    it('hides Users and addresses and the Organization key from a delinquent Mail Essentials organization without sub-users', () => {
        const organization = buildOrganizationWithKeys({
            PlanName: PLANS.MAIL_PRO,
            State: ORGANIZATION_STATE.DELINQUENT,
            UsedMembers: 1,
        });

        expect(getMultiUserPages({ plan: PLANS.MAIL_PRO, organization })).toEqual({
            usersAndAddresses: false,
            organizationKey: false,
            scribeFeatureAccess: true,
        });
    });

    it('keeps Users and addresses for a delinquent Mail Plus organization that still has sub-users to delete', () => {
        const organization = buildOrganizationWithKeys({
            PlanName: PLANS.MAIL,
            State: ORGANIZATION_STATE.DELINQUENT,
            UsedMembers: 2,
        });

        expect(getMultiUserPages({ plan: PLANS.MAIL, organization }).usersAndAddresses).toBe(true);
    });

    it('hides Users and addresses from a Mail Essentials admin without the user read permission', () => {
        expect(
            getMultiUserPages({ plan: PLANS.MAIL_PRO, permissions: permissionsWithout('account.user.read') })
                .usersAndAddresses
        ).toBe(false);
    });
});

describe('Feature access', () => {
    const lumoApiFlags = { ...defaultFlags, isLumoApiEnabled: true };

    const getFeatureAccess = (input: OrganizationRoutesInput) => {
        const { routes, featureAccess } = getOrganizationAppRoutes(
            buildOrganizationRouterParams({ app: APPS.PROTONMAIL, ...input })
        );

        return {
            section: findSubsection(routes.accessControl.subsections, 'feature-access')?.available,
            ...featureAccess,
        };
    };

    it('shows only the Lumo API toggle to a Pass Business organization without Scribe or Zoom', () => {
        expect(getFeatureAccess({ plan: PLANS.PASS_BUSINESS, flags: lumoApiFlags })).toEqual({
            section: true,
            canShowScribe: false,
            canShowVideoConference: false,
            canShowLumoApi: true,
        });
    });

    it('hides the Lumo API toggle from a Pass Business organization when the flag is off', () => {
        expect(getFeatureAccess({ plan: PLANS.PASS_BUSINESS, flags: defaultFlags })).toMatchObject({
            section: false,
            canShowLumoApi: false,
        });
    });

    it('hides the Lumo API toggle from a single-user Mail Plus organization', () => {
        expect(getFeatureAccess({ plan: PLANS.MAIL, flags: lumoApiFlags }).canShowLumoApi).toBe(false);
    });
});

describe('external members', () => {
    const getExternalMemberRoutes = (input: OrganizationRoutesInput) => {
        const { users, filter } = getRoutes(input);

        return {
            usersTitle: users.text,
            multiUserCreation: findSubsection(users.subsections, 'multi-user-creation')?.available,
            organizationFilters: filter.available,
        };
    };

    it.each([
        { name: 'a VPN Business organization', input: { plan: PLANS.VPN_BUSINESS } },
        { name: 'an MSP subsidiary without entitlements', input: { organization: mspSubsidiary } },
    ] as const)('treats $name as having external members', ({ input }) => {
        expect(getExternalMemberRoutes(input)).toEqual({
            usersTitle: 'Users',
            multiUserCreation: false,
            organizationFilters: false,
        });
    });

    it('treats a Mail Essentials organization as having internal members', () => {
        expect(getExternalMemberRoutes({ plan: PLANS.MAIL_PRO })).toEqual({
            usersTitle: 'Users and addresses',
            multiUserCreation: true,
            organizationFilters: true,
        });
    });

    it('hides Create multiple user accounts from a Mail Essentials organization that does not require keys', () => {
        const organization = buildOrganizationWithKeys({ PlanName: PLANS.MAIL_PRO, RequiresKey: 0 });

        expect(getExternalMemberRoutes({ plan: PLANS.MAIL_PRO, organization }).multiUserCreation).toBe(false);
    });
});
describe('getOrganizationAppRoutes gateways', () => {
    const isGatewaysAvailable = (input: OrganizationRoutesInput) =>
        getOrganizationAppRoutes(buildOrganizationRouterParams(input)).routes.gateways.available;

    it.each([PLANS.VPN_BUSINESS, PLANS.VPN_PRO] as const)('shows Gateways to a %s organization', (plan) => {
        expect(isGatewaysAvailable({ plan })).toBe(true);
    });

    it.each([PLANS.PASS_BUSINESS, PLANS.PASS_PRO] as const)('hides Gateways from a %s organization', (plan) => {
        expect(isGatewaysAvailable({ plan })).toBe(false);
    });

    it('hides Gateways from a VPN Business admin without the gateway permission', () => {
        expect(
            isGatewaysAvailable({ plan: PLANS.VPN_BUSINESS, permissions: permissionsWithout('account.gateway.read') })
        ).toBe(false);
    });
});

describe('getOrganizationAppRoutes domain names', () => {
    const isDomainNamesAvailable = (input: OrganizationRoutesInput) =>
        getOrganizationAppRoutes(buildOrganizationRouterParams(input)).routes.domains.available;

    it.each([PLANS.MAIL_PRO, PLANS.BUNDLE_PRO_2024, PLANS.FAMILY, PLANS.MEET_BUSINESS] as const)(
        'shows Domain names to a %s organization that can host addresses on its own domain',
        (plan) => {
            expect(isDomainNamesAvailable({ plan })).toBe(true);
        }
    );

    it.each([PLANS.VPN_BUSINESS, PLANS.PASS_BUSINESS] as const)(
        'hides Domain names from a %s organization that cannot host addresses on its own domain',
        (plan) => {
            expect(isDomainNamesAvailable({ plan })).toBe(false);
        }
    );

    it('hides Domain names from an admin without the domain read permission', () => {
        expect(
            isDomainNamesAvailable({ plan: PLANS.MAIL_PRO, permissions: permissionsWithout('account.domain.read') })
        ).toBe(false);
    });

    it('keeps Domain names for a delinquent organization that still has domains, so it can delete them', () => {
        const delinquentOrganization = buildOrganizationWithKeys({
            State: ORGANIZATION_STATE.DELINQUENT,
            UsedDomains: 1,
        });

        expect(isDomainNamesAvailable({ organization: delinquentOrganization })).toBe(true);
    });
});

describe('getOrganizationAppRoutes single sign-on', () => {
    const getSsoRoute = (input: OrganizationRoutesInput) => {
        const { sso } = getRoutes({ app: APPS.PROTONPASS, ...input });
        return { available: sso.available, upgradeRequired: sso.upgradeRequired };
    };

    const ssoForPbsFlags = { ...defaultFlags, isSsoForPbsEnabled: true };

    it.each([PLANS.PASS_BUSINESS, PLANS.VPN_BUSINESS] as const)(
        'shows SSO without an upgrade badge to a %s organization, which has the sso entitlement',
        (plan) => {
            expect(getSsoRoute({ plan })).toEqual({ available: true, upgradeRequired: false });
        }
    );

    it.each([PLANS.PASS_PRO, PLANS.VPN_PRO] as const)(
        'shows SSO with an upgrade badge to a %s organization',
        (plan) => {
            expect(getSsoRoute({ plan })).toEqual({ available: true, upgradeRequired: true });
        }
    );

    it('hides SSO from a Workspace Standard organization while SsoForPbs is off', () => {
        expect(getSsoRoute({ plan: PLANS.BUNDLE_PRO_2024 }).available).toBe(false);
    });

    it('shows SSO without an upgrade badge to a Workspace Standard organization when SsoForPbs is on', () => {
        expect(getSsoRoute({ plan: PLANS.BUNDLE_PRO_2024, flags: ssoForPbsFlags })).toEqual({
            available: true,
            upgradeRequired: false,
        });
    });

    it('hides SSO from a Mail Essentials organization', () => {
        expect(getSsoRoute({ plan: PLANS.MAIL_PRO, flags: ssoForPbsFlags }).available).toBe(false);
    });

    it('shows SSO to a Pass Professional MSP subsidiary that cannot read its subscription', () => {
        const subsidiary = buildOrganizationWithKeys({ IsSubsidiary: true });

        expect(getSsoRoute({ plan: PLANS.PASS_BUSINESS, organization: subsidiary })).toEqual({
            available: true,
            upgradeRequired: false,
        });
    });

    it('hides SSO from an admin without the SSO read permission', () => {
        expect(
            getSsoRoute({ plan: PLANS.PASS_BUSINESS, permissions: permissionsWithout('account.sso_config.read') })
                .available
        ).toBe(false);
    });
});
