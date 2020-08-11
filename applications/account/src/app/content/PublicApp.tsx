import React, { useCallback, useRef, useState } from 'react';
import { Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import ForceRefreshContext from 'react-components/containers/forceRefresh/context';
import { OnLoginCallbackArguments, ProtonLoginCallback } from 'react-components/containers/app/interface';
import { LocalSessionResponse } from 'proton-shared/lib/authentication/interface';
import { produceFork, ProduceForkParameters } from 'proton-shared/lib/authentication/sessionForking';
import { SSO_PATHS } from 'proton-shared/lib/constants';
import { FORK_TYPE } from 'proton-shared/lib/authentication/ForkInterface';
import { GetActiveSessionsResult } from 'proton-shared/lib/authentication/persistedSessionHelper';
import {
    AccountForgotUsernameContainer,
    AccountLoginContainer,
    AccountResetPasswordContainer,
    AccountSignupContainer,
    AccountSwitchContainer,
    SSOForkProducer,
    useApi,
} from 'react-components';

import AccountPublicLayoutWrapper from './AccountPublicLayoutWrapper';
import { APP_NAME } from '../config';
import AccountPublicApp from './AccountPublicApp';

interface Props {
    onLogin: ProtonLoginCallback;
    locales: TtagLocaleMap;
}

const PublicApp = ({ onLogin, locales }: Props) => {
    const history = useHistory();
    const location = useLocation();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);
    const api = useApi();
    const [forkState, setForkState] = useState<ProduceForkParameters | undefined>();
    const [activeSessions, setActiveSessions] = useState<LocalSessionResponse[] | undefined>();
    const ignoreAutoRef = useRef(false);

    const handleLogin = async (args: OnLoginCallbackArguments) => {
        if (forkState) {
            const { keyPassword, UID } = args;
            await produceFork({ api, UID, keyPassword, ...forkState });
            return;
        }
        return onLogin(args);
    };

    const handleActiveSessionsFork = (
        newForkState: ProduceForkParameters,
        { session, sessions }: GetActiveSessionsResult
    ) => {
        const isSwitchType = newForkState.type === FORK_TYPE.SWITCH;

        if (session && sessions.length === 1 && !isSwitchType) {
            const { UID, keyPassword } = session;
            return produceFork({ api, UID, keyPassword, ...newForkState });
        }

        ignoreAutoRef.current = true;

        setForkState(newForkState);
        setActiveSessions(sessions);

        history.replace(sessions.length >= 1 ? SSO_PATHS.SWITCH : '/login');
    };

    const handleInvalidFork = () => {
        ignoreAutoRef.current = true;
        history.replace('/login');
    };

    const handleActiveSessions = ({ session, sessions }: GetActiveSessionsResult) => {
        // Ignore the automatic login behavior when the initial load was from a fork request, or switch route
        if (ignoreAutoRef.current || location.pathname.startsWith(SSO_PATHS.SWITCH)) {
            setActiveSessions(sessions);
            return false;
        }
        if (!sessions.length) {
            setActiveSessions(sessions);
            return false;
        }
        if (session && sessions.length === 1) {
            onLogin(session);
            return true;
        }
        history.replace(SSO_PATHS.SWITCH);
        setActiveSessions(activeSessions);
        return false;
    };

    return (
        <Switch>
            <Route path={SSO_PATHS.AUTHORIZE}>
                <SSOForkProducer onInvalidFork={handleInvalidFork} onActiveSessions={handleActiveSessionsFork} />
            </Route>
            <Route path="*">
                <AccountPublicApp locales={locales} onLogin={onLogin} onActiveSessions={handleActiveSessions}>
                    <ForceRefreshContext.Provider value={refresh}>
                        <Switch>
                            <Route path={SSO_PATHS.SWITCH}>
                                <AccountSwitchContainer
                                    activeSessions={activeSessions}
                                    toAppNameKey={forkState?.app || APP_NAME}
                                    onLogin={handleLogin}
                                    Layout={AccountPublicLayoutWrapper}
                                />
                            </Route>
                            <Route path={SSO_PATHS.SIGNUP}>
                                <AccountSignupContainer onLogin={handleLogin} Layout={AccountPublicLayoutWrapper} />
                            </Route>
                            <Route path={SSO_PATHS.RESET_PASSWORD}>
                                <AccountResetPasswordContainer
                                    onLogin={handleLogin}
                                    Layout={AccountPublicLayoutWrapper}
                                />
                            </Route>
                            <Route path={SSO_PATHS.FORGOT_USERNAME}>
                                <AccountForgotUsernameContainer Layout={AccountPublicLayoutWrapper} />
                            </Route>
                            <Route path={SSO_PATHS.LOGIN}>
                                <AccountLoginContainer onLogin={handleLogin} Layout={AccountPublicLayoutWrapper} />
                            </Route>
                            <Redirect to={SSO_PATHS.LOGIN} />
                        </Switch>
                    </ForceRefreshContext.Provider>
                </AccountPublicApp>
            </Route>
        </Switch>
    );
};

export default PublicApp;
