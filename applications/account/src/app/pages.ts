import { UserModel, Organization } from 'proton-shared/lib/interfaces';
import { SectionConfig } from 'react-components';
import { c } from 'ttag';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { getSubscriptionPage } from './containers/SubscriptionContainer';
import { getAccountPage } from './containers/AccountContainer';
import { getOrganizationPage } from './containers/OrganizationContainer';
import { getGeneralPage } from './containers/GeneralContainer';
import { getSecurityPage } from './containers/SecurityContainer';

export const getOverviewPage = () => {
    return {
        text: c('Title').t`Overview`,
        to: '/overview',
        icon: 'apps',
    };
};

export const getPages = (user: UserModel, organization: Organization, hasEarlyAccess: boolean): SectionConfig[] =>
    [
        getOverviewPage(),
        getAccountPage(user),
        user.canPay && getSubscriptionPage(user),
        getGeneralPage({ hasEarlyAccess }),
        getSecurityPage(),
        user.isAdmin && !user.isSubUser && getOrganizationPage(organization),
    ].filter(isTruthy);
