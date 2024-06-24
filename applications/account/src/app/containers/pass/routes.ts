import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import { APPS, APP_NAMES, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { getHasPassB2BPlan, hasBundlePro2024, hasPassBusiness } from '@proton/shared/lib/helpers/subscription';
import { Organization, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    app: APP_NAMES;
    user: UserModel;
    organization?: Organization;
    subscription?: Subscription;
    canDisplayB2BLogsPass?: boolean;
}

export const getPassAppRoutes = ({ app, user, organization, subscription, canDisplayB2BLogsPass }: Props) => {
    const isAdmin = user.isAdmin && !user.isSubUser;
    const canHaveOrganization = !user.isMember && !!organization && isAdmin;
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);
    const hasPassB2BPlanWithEventLogging = getHasPassB2BPlan(subscription) || hasBundlePro2024(subscription);
    const hasPassBusinessPlan = hasPassBusiness(subscription);

    return <const>{
        available: app === APPS.PROTONPASS,
        header: PASS_APP_NAME,
        routes: {
            downloads: <SectionConfig>{
                text: c('Link').t`Apps and extensions`,
                to: '/download',
                icon: 'arrow-down-line',
                subsections: [
                    {
                        id: 'download`',
                    },
                ],
            },
            activityLogs: <SectionConfig>{
                text: c('Link').t`Activity log`,
                to: '/activity-log',
                icon: 'text-title',
                available:
                    canDisplayB2BLogsPass &&
                    hasPassB2BPlanWithEventLogging &&
                    canHaveOrganization &&
                    (hasOrganizationKey || hasOrganization),
                subsections: [
                    {
                        id: 'activity-log',
                    },
                ],
            },
            policies: <SectionConfig>{
                text: c('Title').t`Policies`,
                to: '/policies',
                icon: 'checkmark-triple',
                available: (hasOrganizationKey || hasOrganization) && isAdmin && hasPassBusinessPlan,
                subsections: [
                    {
                        id: 'policies',
                    },
                ],
            },
        },
    };
};
