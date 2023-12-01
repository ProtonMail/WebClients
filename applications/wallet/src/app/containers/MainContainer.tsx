import { Redirect, Route, Switch } from 'react-router-dom';

import { ErrorBoundary, StandardErrorPage } from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';

import { PrivateWalletLayout } from '../components';
import { useBlockchainData } from '../hooks/useBlockchainData';
import { wallets } from '../tests/fixtures/api';
import { BitcoinOnRampContainer } from './BitcoinOnRampContainer';
import { BitcoinTransferContainer } from './BitcoinTransferContainer';
import { MultiWalletDashboardContainer } from './MultiWalletDashboardContainer';
import { SingleWalletDashboardContainer } from './SingleWalletDashboardContainer';

const MainContainer = () => {
    const { walletsWithBalanceAndTxs, loading } = useBlockchainData(wallets);

    return (
        <ErrorBoundary component={<StandardErrorPage big />}>
            <QuickSettingsRemindersProvider>
                <PrivateWalletLayout contentLoading={loading} wallets={walletsWithBalanceAndTxs}>
                    <Switch>
                        <Route path={'/transfer'}>
                            <BitcoinTransferContainer />
                        </Route>
                        <Route path={'/buy'}>
                            <BitcoinOnRampContainer />
                        </Route>
                        <Route path={'/wallets'} exact>
                            <MultiWalletDashboardContainer wallets={walletsWithBalanceAndTxs} />
                        </Route>
                        <Route path={'/wallets/:walletId'}>
                            <SingleWalletDashboardContainer wallets={walletsWithBalanceAndTxs} />
                        </Route>
                        <Redirect to="/wallets" />
                    </Switch>
                </PrivateWalletLayout>
            </QuickSettingsRemindersProvider>
        </ErrorBoundary>
    );
};

export default MainContainer;
