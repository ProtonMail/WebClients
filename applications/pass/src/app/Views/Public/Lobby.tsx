import { type FC, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { AccountSwitcherList, AccountSwitcherTooltip } from 'proton-pass-web/app/Auth/AccountSwitcher';
import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { checkAuthSwitch, useAvailableSessions } from 'proton-pass-web/app/Auth/AuthSwitchProvider';
import { c } from 'ttag';

import { Scroll } from '@proton/atoms';
import { DropdownButton, Icon } from '@proton/components';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { useConnectivityBar } from '@proton/pass/components/Core/ConnectivityProvider';
import { LobbyContent } from '@proton/pass/components/Layout/Lobby/LobbyContent';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { type AuthRouteState } from '@proton/pass/components/Navigation/routing';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { clientBusy, clientErrored } from '@proton/pass/lib/client';
import { AppStatus, type MaybeNull } from '@proton/pass/types';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

export const Lobby: FC = () => {
    const { SSO_URL: host } = usePassConfig();
    const authService = useAuthService();
    const authStore = useAuthStore();
    const app = useAppState();
    const { status } = app.state;
    const sessions = useAvailableSessions();

    const history = useHistory<MaybeNull<AuthRouteState>>();

    const connectivityBar = useConnectivityBar((online) => ({
        className: clsx('bg-danger fixed bottom-0 left-0'),
        text: c('Info').t`No network connection`,
        hidden: online || clientBusy(status),
    }));

    const warning = useMemo(() => {
        const err = history.location.state?.error;
        if (err) {
            switch (err) {
                case 'fork':
                    return c('Error').t`The session has expired. Please sign in again.`;
                default:
                    return c('Error').t`Something went wrong. Please sign in again.`;
            }
        }
        if (clientErrored(status)) return c('Error').t`An error occurred while resuming your session`;
    }, [history.location.state, status]);

    return (
        <LobbyLayout overlay>
            <LobbyContent
                status={status}
                warning={warning}
                onLogin={(options) => {
                    if (warning) history.replace({ ...history.location, state: null });
                    return authService.init(options);
                }}
                onLogout={() => authService.logout({ soft: false })}
                onFork={() => authService.requestFork({ host, app: APPS.PROTONPASS, forkType: ForkType.SWITCH })}
                onOffline={() => app.setStatus(AppStatus.PASSWORD_LOCKED)}
                onRegister={() => authService.requestFork({ host, app: APPS.PROTONPASS, forkType: ForkType.SIGNUP })}
                renderError={() => <></>}
                renderAccountSwitcher={() => {
                    if (!checkAuthSwitch()) return null;

                    /** If the auth store has been cleared when reaching the lobby,
                     * show the full available sessions list. This can happen when
                     * logging out of a session with multiple active sessions */
                    if (!authStore?.hasSession()) {
                        return (
                            sessions.length > 0 && (
                                <Scroll
                                    className="overflow-auto mb-4 max-h-custom"
                                    style={{ '--max-h-custom': '11.5em' }}
                                >
                                    <div className="flex flex-column gap-2">
                                        <AccountSwitcherList sessions={sessions} />
                                    </div>
                                </Scroll>
                            )
                        );
                    }

                    return (
                        <AccountSwitcherTooltip sessions={sessions}>
                            {({ anchorRef, isOpen, toggle }) => (
                                <div className="relative text-rg mb-2 text-ellipsis max-w-full flex justify-center">
                                    <DropdownButton
                                        className="flex gap-2"
                                        color="weak"
                                        hasCaret
                                        icon
                                        isOpen={isOpen}
                                        onClick={toggle}
                                        pill
                                        ref={anchorRef}
                                        shape="ghost"
                                    >
                                        <Icon name="user" />
                                        <span>{authStore?.getUserEmail()}</span>
                                    </DropdownButton>
                                </div>
                            )}
                        </AccountSwitcherTooltip>
                    );
                }}
            />

            {connectivityBar}
        </LobbyLayout>
    );
};
