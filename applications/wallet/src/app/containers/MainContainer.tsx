import { Redirect, Route, Switch } from 'react-router-dom';

import { ErrorBoundary, StandardErrorPage } from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';

import { withLayout } from '../components';
import { BitcoinBlockchainContextProvider } from '../contexts/BitcoinBlockchainContext/BitcoinBlockchainContextProvider';
import { BitcoinOnRampContainer } from './BitcoinOnRampContainer';
import { BitcoinTransferContainer } from './BitcoinTransferContainer';
import { MultiWalletDashboardContainer } from './MultiWalletDashboardContainer';
import { SingleWalletDashboardContainer } from './SingleWalletDashboardContainer';
import { TransactionHistoryContainer } from './TransactionHistoryContainer';

const MainContainer = () => {
    return (
        <ErrorBoundary component={<StandardErrorPage big />}>
            <QuickSettingsRemindersProvider>
                <BitcoinBlockchainContextProvider>
                    <Switch>
                        <Route path={'/transfer'}>{withLayout(<BitcoinTransferContainer />)}</Route>
                        <Route path={'/buy'}>{withLayout(<BitcoinOnRampContainer />)}</Route>
                        <Route path={'/transactions'} exact>
                            {withLayout(<TransactionHistoryContainer />)}
                        </Route>
                        <Route path={'/wallets/:walletId'}>{withLayout(<SingleWalletDashboardContainer />)}</Route>
                        <Route path={'/wallets'} exact>
                            {withLayout(<MultiWalletDashboardContainer />)}
                        </Route>
                        <Redirect to="/wallets" />
                    </Switch>
                </BitcoinBlockchainContextProvider>
            </QuickSettingsRemindersProvider>
        </ErrorBoundary>
    );
};

export default MainContainer;
