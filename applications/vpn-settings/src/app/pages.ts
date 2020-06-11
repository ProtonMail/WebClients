import { SectionConfig } from 'react-components';
import { UserModel } from 'proton-shared/lib/interfaces';

import { getDashboardPage } from './containers/DashboardContainer';
import { getAccountPage } from './containers/AccountContainer';
import { getDownloadsPage } from './containers/DownloadsContainer';
import { getPaymentsPage } from './containers/PaymentsContainer';

export const getPages = (user: UserModel): SectionConfig[] => [
    getDashboardPage(user),
    getAccountPage(),
    getDownloadsPage(),
    getPaymentsPage()
];
