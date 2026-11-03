import { c } from 'ttag';

import type { SectionConfig } from '@proton/components/containers/layout/interface';
import { getPassOrganizationAccess, getPassPageAvailability } from '@proton/console/pass/getPassOrganizationAccess';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcChartLine } from '@proton/icons/icons/IcChartLine';
import { IcCheckmarkTriple } from '@proton/icons/icons/IcCheckmarkTriple';
import { IcTextTitle } from '@proton/icons/icons/IcTextTitle';
import { APPS, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';

import type { OrganizationRouterParams } from '../../content/router-params';

export const getPassAppRoutes = ({ app, organization, permissions, entitlements }: OrganizationRouterParams) => {
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);

    const { isPolicyUpgradeRequired } = getPassOrganizationAccess({ organization, entitlements });
    const pageAvailability = getPassPageAvailability({ organization, entitlements, permissions });
    const canUpgradeToPassActivityLog = entitlements.isPassB2BWithoutActivityMonitor;

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
                    (entitlements.hasPassActivityMonitor || canUpgradeToPassActivityLog),
                upgradeRequired: !entitlements.hasPassActivityMonitor,
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
                available: pageAvailability.policies,
                upgradeRequired: isPolicyUpgradeRequired,
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
                available: pageAvailability.reports,
                upgradeRequired: isPolicyUpgradeRequired,
                subsections: [
                    {
                        id: 'reports',
                    },
                ],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
