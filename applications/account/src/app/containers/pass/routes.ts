import { c } from 'ttag';

import type { SectionConfig } from '@proton/components';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcChartLine } from '@proton/icons/icons/IcChartLine';
import { IcCheckmarkTriple } from '@proton/icons/icons/IcCheckmarkTriple';
import { IcTextTitle } from '@proton/icons/icons/IcTextTitle';
import { PLANS } from '@proton/payments/core/constants';
import {
    getPlanName,
    hasAnyB2bBundle,
    hasPassBusiness,
    hasVPNPassProfessional,
} from '@proton/payments/core/subscription/helpers';
import { APPS, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';

import type { OrganizationRouterParams } from '../../content/router-params';

export const getPassAppRoutes = ({
    app,
    user,
    organization,
    subscription,
    permissions,
    entitlements,
    flags,
}: OrganizationRouterParams) => {
    const isAdmin = user.isAdmin && user.isSelf;
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);
    // Activity log resolves the acting user's own org, not the subsidiary's, so it's hidden for
    // subsidiaries until the backend is fixed. Remove once MSPPassSettingsFullyEnabled is rolled out.
    const isSubsidiaryOrg = !!organization?.IsSubsidiary;

    // passbiz2024 or bundlepro2024 or bundlepro2022 or vpnpassbiz2025
    // MSP subsidiary orgs don't own their subscription (it belongs to the MSP manager), so `subscription`
    // resolves to the free/dummy value for them. Workaround: MSP currently only runs on Pass Pro, which is
    // already a B2B plan, so treat subsidiaries as such directly (same pattern as organization/routes.ts).
    const hasPassOrBundleB2B =
        hasPassBusiness(subscription) ||
        hasAnyB2bBundle(subscription) ||
        hasVPNPassProfessional(subscription) ||
        !!organization?.IsSubsidiary;

    // passpro2024 — Pass Essentials admins see these pages with an "Upgrade required" badge.
    const isPassEssentials = getPlanName(subscription) === PLANS.PASS_PRO;

    return <const>{
        available: app === APPS.PROTONPASS || app === APPS.PROTONACCOUNT,
        header: PASS_APP_NAME,
        routes: {
            downloads: {
                id: 'downloads',
                text: c('Link').t`Apps and extensions`,
                to: '/download',
                icon: IcArrowDownLine,
                subsections: [
                    {
                        id: 'download',
                    },
                ],
            },
            activityLogs: {
                id: 'activityLogs',
                text: c('Link').t`Activity log`,
                to: '/activity-log',
                icon: IcTextTitle,
                available:
                    (hasOrganizationKey || hasOrganization) &&
                    permissions['account.activity_log.read'] &&
                    (entitlements.orgHasPassActivityMonitor || isPassEssentials) &&
                    (!isSubsidiaryOrg || flags.isMspPassSettingsFullyEnabled),
                upgradeRequired: isPassEssentials,
                subsections: [
                    {
                        id: 'activity-log',
                    },
                ],
            },
            policies: {
                id: 'policies',
                text: c('Title').t`Policies`,
                to: '/policies',
                icon: IcCheckmarkTriple,
                available:
                    (hasOrganizationKey || hasOrganization) && isAdmin && (hasPassOrBundleB2B || isPassEssentials),
                upgradeRequired: isPassEssentials,
                subsections: [
                    {
                        id: 'policies',
                    },
                ],
            },
            reports: {
                id: 'reports',
                text: c('Title').t`Reports`,
                to: '/reports',
                icon: IcChartLine,
                available:
                    (hasOrganizationKey || hasOrganization) && isAdmin && (hasPassOrBundleB2B || isPassEssentials),
                upgradeRequired: isPassEssentials,
                subsections: [
                    {
                        id: 'reports',
                    },
                ],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
