import { Route, Switch } from 'react-router-dom';

import { ErrorBoundary, StandardErrorPage } from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';

import { PrivateWalletLayout } from '../components';
import { BitcoinOnRampContainer } from './BitcoinOnRampContainer';
import { BitcoinTransferContainer } from './BitcoinTransferContainer';
import { MultiWalletDashboardContainer } from './MultiWalletDashboardContainer';
import { SingleWalletDashboardContainer } from './SingleWalletDashboardContainer';

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
                        <Route path={'/wallets/:walletId'}>
                            <SingleWalletDashboardContainer />
                        </Route>
                        <Route path={'/buy'}>
                            <BitcoinOnRampContainer />
                        </Route>
                        <Route path={'*'}>
                            <MultiWalletDashboardContainer />
                        </Route>
                    </Switch>
                </PrivateWalletLayout>
            </QuickSettingsRemindersProvider>
        </ErrorBoundary>
    );
};

export default MainContainer;
