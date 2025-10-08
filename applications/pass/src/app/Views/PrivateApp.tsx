import { type FC, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useToggle from '@proton/components/hooks/useToggle';
import { AuthDeviceTopBanner } from '@proton/pass/components/Auth/AuthDeviceTopBanner';
import { BulkSelectProvider } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { useConnectivityBar } from '@proton/pass/components/Core/ConnectivityProvider';
import { LockProbeProvider } from '@proton/pass/components/Core/LockProbeProvider';
import { InviteProvider } from '@proton/pass/components/Invite/InviteProvider';
import { ItemActionsProvider } from '@proton/pass/components/Item/ItemActionsProvider';
import { Sidebar } from '@proton/pass/components/Layout/Section/Sidebar';
import { LockOnboarding } from '@proton/pass/components/Lock/LockOnboarding';
import type { OnReauthFn } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PasswordUnlockProvider } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PinUnlockProvider } from '@proton/pass/components/Lock/PinUnlockProvider';
import { InAppNotificationProvider } from '@proton/pass/components/Notifications/InAppNotificationPortal';
import { InAppNotifications } from '@proton/pass/components/Notifications/InAppNotifications';
import { OnboardingProvider } from '@proton/pass/components/Onboarding/OnboardingProvider';
import { OnboardingSSO } from '@proton/pass/components/Onboarding/OnboardingSSO';
import { OrganizationProvider } from '@proton/pass/components/Organization/OrganizationProvider';
import { PasswordProvider } from '@proton/pass/components/Password/PasswordProvider';
import { SpotlightProvider } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { WithSpotlight } from '@proton/pass/components/Spotlight/WithSpotlight';
import { UpsellingProvider } from '@proton/pass/components/Upsell/UpsellingProvider';
import { FirstChild } from '@proton/pass/components/Utils/FirstChild';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { clientOffline } from '@proton/pass/lib/client';
import { offlineResume } from '@proton/pass/store/actions';
import { selectIsSSO, selectLockSetupRequired, selectRequestInFlight } from '@proton/pass/store/selectors';
import { SpotlightMessage } from '@proton/pass/types';
import { APPS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { ExtensionInstallBar } from './Header/ExtensionInstallBar';
import { Header } from './Header/Header';
import { LinuxUpdateBar } from './Header/LinuxUpdateBar';
import { PrivateRouter } from './PrivateRouter';
import { Menu } from './Sidebar/Menu';

const Main: FC = () => {
    const dispatch = useDispatch();
    const { status } = useAppState();
    const authStore = useAuthStore();
    const localID = authStore?.getLocalID();
    const offline = clientOffline(status);
    const offlineResuming = useSelector(selectRequestInFlight(offlineResume.requestID()));
    const isSSO = useSelector(selectIsSSO);

    /** FIXME: update `useToggle` so callbacks are stable */
    const { state: expanded, set } = useToggle();
    const toggle = useCallback(() => set((prev) => !prev), []);

    const connectivityBar = useConnectivityBar((online) => ({
        className: offline ? 'bg-weak border-top' : 'bg-danger',
        hidden: online && !offline,
        text: offline ? (
            <div className="flex items-center gap-2">
                <span>{c('Info').t`Offline mode`}</span>

                <Button
                    className="text-sm"
                    onClick={() => dispatch(offlineResume.intent({ localID }))}
                    shape="underline"
                    size="small"
                    loading={offlineResuming}
                    disabled={offlineResuming}
                >
                    {offlineResuming ? c('Info').t`Reconnecting` : c('Info').t`Reconnect`}
                </Button>
            </div>
        ) : undefined,
    }));

    return (
        <div className="content-container flex flex-1 shrink-0 flex-column">
            <FirstChild>
                <AuthDeviceTopBanner />
                {BUILD_TARGET === 'linux' && <LinuxUpdateBar />}
                {BUILD_TARGET === 'web' && <ExtensionInstallBar />}
            </FirstChild>

            <div className="flex flex-row flex-nowrap overflow-hidden flex-1 relative w-full h-full anime-fade-in">
                <Sidebar expanded={expanded} onToggle={toggle}>
                    <Menu onToggle={toggle} />
                </Sidebar>

                <main id="main" className="content flex-1 overflow-hidden">
                    <div className="flex flex-nowrap flex-column h-full">
                        <Header sidebarExpanded={expanded} sidebarToggle={toggle} />
                        <div className="flex items-center justify-center flex-nowrap w-full h-full">
                            <PrivateRouter />
                            {isSSO && (
                                <WithSpotlight type={SpotlightMessage.SSO_CHANGE_LOCK}>
                                    {(props) => <OnboardingSSO {...props} />}
                                </WithSpotlight>
                            )}
                            <InAppNotifications />
                        </div>
                    </div>
                </main>
            </div>
            {connectivityBar}
        </div>
    );
};

export const PrivateApp: FC = () => {
    const lockSetup = useSelector(selectLockSetupRequired);
    const config = usePassConfig();
    const authStore = useAuthStore();
    const auth = useAuthService();
    const logout = useCallback(() => auth.logout({ soft: true }), []);
    const handleProbe = useCallback(() => auth.checkLock().catch(noop), []);

    const onReauth = useCallback<OnReauthFn>((reauth, fork) => {
        const localID = authStore?.getLocalID();
        const userID = authStore?.getUserID();

        auth.requestFork(
            {
                app: APPS.PROTONPASS,
                host: config.SSO_URL,
                localID,
                ...fork,
            },
            { localID, reauth, type: 'reauth', userID }
        );
    }, []);

    return (
        <LockProbeProvider onProbe={handleProbe}>
            <PasswordUnlockProvider onReauth={onReauth}>
                <PinUnlockProvider>
                    <OrganizationProvider>
                        <BulkSelectProvider>
                            <ItemActionsProvider>
                                <VaultActionsProvider>
                                    <InviteProvider>
                                        <PasswordProvider>
                                            <UpsellingProvider>
                                                <SpotlightProvider>
                                                    <InAppNotificationProvider>
                                                        <OnboardingProvider>
                                                            {lockSetup ? (
                                                                <LockOnboarding onCancel={logout} />
                                                            ) : (
                                                                <Main />
                                                            )}
                                                        </OnboardingProvider>
                                                    </InAppNotificationProvider>
                                                </SpotlightProvider>
                                            </UpsellingProvider>
                                        </PasswordProvider>
                                    </InviteProvider>
                                </VaultActionsProvider>
                            </ItemActionsProvider>
                        </BulkSelectProvider>
                    </OrganizationProvider>
                </PinUnlockProvider>
            </PasswordUnlockProvider>
        </LockProbeProvider>
    );
};
