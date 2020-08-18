import { UserModel, Organization } from 'proton-shared/lib/interfaces';
import { SectionConfig } from 'react-components';
import { c } from 'ttag';

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

export const getPages = (user: UserModel, organization: Organization): SectionConfig[] => [
    getOverviewPage(),
    getAccountPage(),
    getSubscriptionPage(user),
    getGeneralPage(),
    getSecurityPage(),
    getOrganizationPage(organization),
];
