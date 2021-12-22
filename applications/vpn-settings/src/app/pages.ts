import { SectionConfig } from '@proton/components';
import { UserModel } from '@proton/shared/lib/interfaces';

import { getDashboardPage } from './containers/DashboardContainer';
import { getGeneralPage } from './containers/GeneralContainer';
import { getAccountPage } from './containers/AccountContainer';
import { getDownloadsPage } from './containers/DownloadsContainer';
import { getPaymentsPage } from './containers/PaymentsContainer';

export const getPages = (user: UserModel): SectionConfig[] => [
    getDashboardPage(user),
    getGeneralPage(),
    getAccountPage(user),
    getDownloadsPage(),
    getPaymentsPage(),
];
