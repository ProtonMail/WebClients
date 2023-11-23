import { Route, Switch } from 'react-router-dom';

import { ErrorBoundary, StandardErrorPage } from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';

import { PrivateWalletLayout } from '../components';
import { BitcoinTransferContainer } from './BitcoinTransferContainer';
import { DashboardContainer } from './DashboardContainer';
import { WalletsDashboardContainer } from './WalletsDashboardContainer';

const MainContainer = () => {
    // TODO: we may need to init redux here

    return (
        <ErrorBoundary component={<StandardErrorPage big />}>
            <QuickSettingsRemindersProvider>
                <PrivateWalletLayout>
                    <Switch>
                        <Route path={'/transfer'}>
                            <BitcoinTransferContainer />
                        </Route>
                        <Route path={'/wallets'}>
                            <WalletsDashboardContainer />
                        </Route>
                        <Route path={'*'}>
                            <DashboardContainer />
                        </Route>
                    </Switch>
                </PrivateWalletLayout>
            </QuickSettingsRemindersProvider>
        </ErrorBoundary>
    );
};

export default MainContainer;
