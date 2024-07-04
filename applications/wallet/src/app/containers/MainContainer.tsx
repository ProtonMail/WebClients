import { Route, Switch } from 'react-router-dom';

import { ErrorBoundary, StandardErrorPage, useActiveBreakpoint, useFlag } from '@proton/components';
import ContactEmailsProvider from '@proton/components/containers/contacts/ContactEmailsProvider';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { PrivateWalletLayout } from '../components';
import { ResponsiveContainerContextProvider } from '../contexts/ResponsiveContainerContext/ResponsiveContainerContextProvider';
import { AccountContainer } from './AccountContainer';
import { EmptyViewContainer } from './EmptyViewContainer';
import { LockedWalletContainer } from './LockedWalletContainer';
import { WalletContainer } from './WalletContainer';

const MainContainer = () => {
    const { viewportWidth } = useActiveBreakpoint();

    const canAccessWallet = useFlag('Wallet');

    if (!canAccessWallet) {
        replaceUrl(`${getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT)}`);
        return null;
    }

    return (
        <ErrorBoundary component={<StandardErrorPage big />}>
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

                            <Route>
                                <PrivateWalletLayout>
                                    <EmptyViewContainer />
                                </PrivateWalletLayout>
                            </Route>
                        </Switch>
                    </ResponsiveContainerContextProvider>
                </ContactEmailsProvider>
            </QuickSettingsRemindersProvider>
        </ErrorBoundary>
    );
};

export default MainContainer;
