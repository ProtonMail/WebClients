import { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';

import { setPanicHook } from '@proton/andromeda';
import { ContactEmailsProvider, useActiveBreakpoint } from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';

import { PrivateWalletLayout } from '../components';
import { BitcoinBlockchainContextProvider } from '../contexts/BitcoinBlockchainContext/BitcoinBlockchainContextProvider';
import { ResponsiveContainerContextProvider } from '../contexts/ResponsiveContainerContext/ResponsiveContainerContextProvider';
import { WalletDrawerContextProvider } from '../contexts/WalletDrawerContext/WalletDrawerContextProvider';
import { WalletSetupModalContextProvider } from '../contexts/WalletSetupModalContext/WalletSetupModalContextProvider';
import { AccountContainer } from './AccountContainer';
import { DiscoverContainer } from './DiscoverContainer';
import { EmptyViewContainer } from './EmptyViewContainer';
import { LockedWalletContainer } from './LockedWalletContainer';
import { WalletContainer } from './WalletContainer';

const MainContainer = () => {
    const { viewportWidth } = useActiveBreakpoint();

    useEffect(() => {
        setPanicHook();
    }, []);

    return (
        <BitcoinBlockchainContextProvider>
            <WalletSetupModalContextProvider>
                <WalletDrawerContextProvider>
                    <QuickSettingsRemindersProvider>
                        <ContactEmailsProvider>
                            <ResponsiveContainerContextProvider isNarrow={!viewportWidth['>=large']}>
                                <Switch>
                                    <Route exact path={'/wallets/:walletId/accounts/:accountId'}>
                                        <PrivateWalletLayout>
                                            <AccountContainer />
                                        </PrivateWalletLayout>
                                    </Route>

                                    <Route exact path={'/wallets/:walletId/locked'}>
                                        <PrivateWalletLayout>
                                            <LockedWalletContainer />
                                        </PrivateWalletLayout>
                                    </Route>

                                    <Route exact path={'/wallets/:walletId'}>
                                        <PrivateWalletLayout>
                                            <WalletContainer />
                                        </PrivateWalletLayout>
                                    </Route>

                                    <Route exact path={'/discover'}>
                                        <PrivateWalletLayout>
                                            <DiscoverContainer />
                                        </PrivateWalletLayout>
                                    </Route>

                                    <Route>
                                        <PrivateWalletLayout>
                                            <EmptyViewContainer />
                                        </PrivateWalletLayout>
                                    </Route>
                                </Switch>
                            </ResponsiveContainerContextProvider>
                        </ContactEmailsProvider>
                    </QuickSettingsRemindersProvider>
                </WalletDrawerContextProvider>
            </WalletSetupModalContextProvider>
        </BitcoinBlockchainContextProvider>
    );
};

export default MainContainer;
