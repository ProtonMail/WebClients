import { UserModel } from 'proton-shared/lib/interfaces';

import { getSubscriptionPage } from './containers/SubscriptionContainer';
import { getAccountPage } from './containers/AccountContainer';
import { getOrganizationPage } from './containers/OrganizationContainer';
import { getMembersPage } from './containers/MembersContainer';
import { getGeneralPage } from './containers/GeneralContainer';
import { getSecurityPage } from './containers/SecurityContainer';

export const getPages = (user: UserModel) => [
    getAccountPage(),
    getSubscriptionPage(user),
    getGeneralPage(),
    getSecurityPage(),
    getOrganizationPage(),
    getMembersPage()
];
