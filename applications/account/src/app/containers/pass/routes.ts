import { c } from 'ttag';

import type { SectionConfig } from '@proton/components';
import { hasAnyB2bBundle, hasPassBusiness, hasVPNPassProfessional } from '@proton/payments';
import { APPS, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';

import type { OrganizationRouterParams } from '../../content/router-params';

export const getPassAppRoutes = ({ app, user, organization, subscription, flags }: OrganizationRouterParams) => {
    const { canDisplayB2BLogsPass = false, canDisplayPassReports = false } = flags;
    const isAdmin = user.isAdmin && user.isSelf;
    const canHaveOrganization = !user.isMember && !!organization && isAdmin;
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);
    // passbiz2024 or bundlepro2024 or bundlepro2022 or vpnpassbiz2025
    const hasPassOrBundleB2B =
        hasPassBusiness(subscription) || hasAnyB2bBundle(subscription) || hasVPNPassProfessional(subscription);

    return <const>{
        available: app === APPS.PROTONPASS,
        header: PASS_APP_NAME,
        routes: {
            downloads: {
                id: 'downloads',
                text: c('Link').t`Apps and extensions`,
                to: '/download',
                icon: 'arrow-down-line',
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
                icon: 'text-title',
                available:
                    canDisplayB2BLogsPass &&
                    hasPassOrBundleB2B &&
                    canHaveOrganization &&
                    (hasOrganizationKey || hasOrganization),
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
                icon: 'checkmark-triple',
                available: (hasOrganizationKey || hasOrganization) && isAdmin && hasPassOrBundleB2B,
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
                icon: 'chart-line',
                available:
                    canDisplayPassReports && (hasOrganizationKey || hasOrganization) && isAdmin && hasPassOrBundleB2B,
                subsections: [
                    {
                        id: 'reports',
                    },
                ],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
