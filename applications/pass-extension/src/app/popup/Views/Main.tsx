import { type FC, Suspense, lazy, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Route } from 'react-router-dom';

import { usePopupContext } from 'proton-pass-extension/app/popup/PopupProvider';
import { Router } from 'proton-pass-extension/app/popup/Views/Router';
import { useExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';
import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';
import { useSaveTabState } from 'proton-pass-extension/lib/hooks/useSaveTabState';
import { useSpotlightListener } from 'proton-pass-extension/lib/hooks/useSpotlightListener';

import Loader from '@proton/components/components/loader/Loader';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useNotifications from '@proton/components/hooks/useNotifications';
import { AuthDeviceTopBanner } from '@proton/pass/components/Auth/AuthDeviceTopBanner';
import { BulkSelectProvider } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { ContextMenuProvider } from '@proton/pass/components/ContextMenu/ContextMenuProvider';
import { Header } from '@proton/pass/components/Header/Header';
import { InviteProvider } from '@proton/pass/components/Invite/InviteProvider';
import { ItemActionsProvider } from '@proton/pass/components/Item/ItemActionsProvider';
import { LockOnboarding } from '@proton/pass/components/Lock/LockOnboarding';
import { InAppNotificationProvider } from '@proton/pass/components/Notifications/InAppNotificationPortal';
import { InAppNotifications } from '@proton/pass/components/Notifications/InAppNotifications';
import { OnboardingSSO } from '@proton/pass/components/Onboarding/OnboardingSSO';
import { OrganizationProvider } from '@proton/pass/components/Organization/OrganizationProvider';
import { PasswordProvider } from '@proton/pass/components/Password/PasswordProvider';
import { SpotlightProvider } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { WithSpotlight } from '@proton/pass/components/Spotlight/WithSpotlight';
import { UpsellingProvider } from '@proton/pass/components/Upsell/UpsellingProvider';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import { selectLockSetupRequired } from '@proton/pass/store/selectors/settings';
import { selectIsSSO } from '@proton/pass/store/selectors/user';
import { SpotlightMessage } from '@proton/pass/types/worker/spotlight';
import { resolveSubdomain } from '@proton/pass/utils/url/utils';

const Sidebar = lazy(
    () => import(/* webpackChunkName: "sidebar" */ 'proton-pass-extension/app/popup/Views/LazySidebar')
);

const MainSwitch: FC = () => {
    const isSSO = useSelector(selectIsSSO);
    const { interactive } = usePopupContext();
    const { url } = useExtensionContext();
    const { lock, logout } = useExtensionClient();
    const { viewportWidth } = useActiveBreakpoint();
    useSpotlightListener();

    const showSidebar = viewportWidth.medium || viewportWidth['>=large'];

    return (
        <Route path="*">
            {({ match, ...rest }) => (
                <div className="flex flex-row flex-nowrap overflow-hidden flex-1 relative w-full h-full anime-fade-in">
                    {showSidebar && (
                        <Suspense fallback={<Loader />}>
                            <Sidebar />
                        </Suspense>
                    )}

                    <main
                        key="main"
                        id="main"
                        className="flex flex-column flex-nowrap w-full h-full overflow-hidden anime-fade-in"
                        style={{ '--anime-delay': '50ms' }}
                    >
                        <AuthDeviceTopBanner />
                        <Header
                            onLock={lock}
                            onLogout={logout}
                            interactive={interactive}
                            origin={url ? resolveSubdomain(url) : null}
                        />
                        <div id="pass-layout" className="flex items-center justify-center flex-nowrap w-full h-full">
                            {match && <Router match={match} {...rest} />}
                            <InAppNotifications />
                            {isSSO && (
                                <WithSpotlight type={SpotlightMessage.SSO_CHANGE_LOCK}>
                                    {(props) => <OnboardingSSO {...props} />}
                                </WithSpotlight>
                            )}
                        </div>
                    </main>
                </div>
            )}
        </Route>
    );
};

export const Main: FC = () => {
    const { logout } = useExtensionClient();
    const lockSetup = useSelector(selectLockSetupRequired);

    useSaveTabState();

    /** Clear notifications when `Main` unmounts */
    const { clearNotifications } = useNotifications();
    useEffect(() => () => clearNotifications(), []);

    return (
        <ContextMenuProvider>
            <OrganizationProvider>
                <BulkSelectProvider>
                    <VaultActionsProvider>
                        <ItemActionsProvider>
                            <InviteProvider>
                                <PasswordProvider>
                                    <UpsellingProvider>
                                        <SpotlightProvider>
                                            <InAppNotificationProvider>
                                                {lockSetup ? (
                                                    <LockOnboarding onCancel={() => logout({ soft: true })} />
                                                ) : (
                                                    <MainSwitch />
                                                )}
                                            </InAppNotificationProvider>
                                        </SpotlightProvider>
                                    </UpsellingProvider>
                                </PasswordProvider>
                            </InviteProvider>
                        </ItemActionsProvider>
                    </VaultActionsProvider>
                </BulkSelectProvider>
            </OrganizationProvider>
        </ContextMenuProvider>
    );
};
