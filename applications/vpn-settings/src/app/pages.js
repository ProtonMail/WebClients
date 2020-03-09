import { getDashboardPage } from './containers/DashboardContainer';
import { getAccountPage } from './containers/AccountContainer';
import { getDownloadsPage } from './containers/DownloadsContainer';
import { getPaymentsPage } from './containers/PaymentsContainer';

export const getPages = (user) => [getDashboardPage(user), getAccountPage(), getDownloadsPage(), getPaymentsPage()];
