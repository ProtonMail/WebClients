import { Route, Switch } from 'react-router-dom';

import { ErrorBoundary, StandardErrorPage } from '@proton/components';
import ContactEmailsProvider from '@proton/components/containers/contacts/ContactEmailsProvider';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';

import { PrivateWalletLayout } from '../components';
import { BitcoinBlockchainContextProvider } from '../contexts/BitcoinBlockchainContext/BitcoinBlockchainContextProvider';
import { AccountContainer } from './AccountContainer';
import { EmptyViewContainer } from './EmptyViewContainer';
import { WalletContainer } from './WalletContainer';

const MainContainer = () => {
    return (
        <ErrorBoundary component={<StandardErrorPage big />}>
            <QuickSettingsRemindersProvider>
                <ContactEmailsProvider>
                    <BitcoinBlockchainContextProvider>
                        <Switch>
                            <Route exact path={'/wallets/:walletId/accounts/:accountId'}>
                                <PrivateWalletLayout>
                                    <AccountContainer />
                                </PrivateWalletLayout>
                            </Route>
                            <Route exact path={'/wallets/:walletId'}>
                                <PrivateWalletLayout>
                                    <WalletContainer />
                                </PrivateWalletLayout>
                            </Route>
                            <Route>
                                <PrivateWalletLayout>
                                    <EmptyViewContainer />
                                </PrivateWalletLayout>
                            </Route>
                        </Switch>
                    </BitcoinBlockchainContextProvider>
                </ContactEmailsProvider>
            </QuickSettingsRemindersProvider>
        </ErrorBoundary>
    );
};

export default MainContainer;
