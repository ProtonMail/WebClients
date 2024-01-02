import { Redirect, Route, Switch } from 'react-router-dom';

import { ErrorBoundary, StandardErrorPage } from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';

import { PrivateWalletLayout } from '../components';
import { BlockchainContextProvider } from '../contexts';
import { BitcoinOnRampContainer } from './BitcoinOnRampContainer';
import { BitcoinTransferContainer } from './BitcoinTransferContainer';
import { MultiWalletDashboardContainer } from './MultiWalletDashboardContainer';
import { SingleWalletDashboardContainer } from './SingleWalletDashboardContainer';
import { TransactionHistoryContainer } from './TransactionHistoryContainer';

const MainContainer = () => {
    return (
        <ErrorBoundary component={<StandardErrorPage big />}>
            <QuickSettingsRemindersProvider>
                <BlockchainContextProvider>
                    <PrivateWalletLayout>
                        <Switch>
                            <Route path={'/transfer'}>
                                <BitcoinTransferContainer />
                            </Route>
                            <Route path={'/buy'}>
                                <BitcoinOnRampContainer />
                            </Route>
                            <Route path={'/transactions'} exact>
                                <TransactionHistoryContainer />
                            </Route>
                            <Route path={'/wallets/:walletId'}>
                                <SingleWalletDashboardContainer />
                            </Route>
                            <Route path={'/wallets'} exact>
                                <MultiWalletDashboardContainer />
                            </Route>
                            <Redirect to="/wallets" />
                        </Switch>
                    </PrivateWalletLayout>
                </BlockchainContextProvider>
            </QuickSettingsRemindersProvider>
        </ErrorBoundary>
    );
};

export default MainContainer;
