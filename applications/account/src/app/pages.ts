import { UserModel } from 'proton-shared/lib/interfaces';
import { SectionConfig } from 'react-components';

import { getSubscriptionPage } from './containers/SubscriptionContainer';
import { getAccountPage } from './containers/AccountContainer';
import { getOrganizationPage } from './containers/OrganizationContainer';
import { getGeneralPage } from './containers/GeneralContainer';
import { getSecurityPage } from './containers/SecurityContainer';

export const getPages = (user: UserModel): SectionConfig[] => [
    getAccountPage(),
    getSubscriptionPage(user),
    getGeneralPage(),
    getSecurityPage(),
    getOrganizationPage(),
];
