import React, { FunctionComponent } from 'react';
import { APPS, isSSOMode, isStandaloneMode, SSO_PATHS } from 'proton-shared/lib/constants';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { Route, Switch } from 'react-router-dom';
import { replaceUrl } from 'proton-shared/lib/helpers/browser';
import { getAppHref } from 'proton-shared/lib/apps/helper';
import { requestFork } from 'proton-shared/lib/authentication/sessionForking';
import StandalonePublicApp from './StandalonePublicApp';
import { Loader } from '../../components';
import { useAuthentication, useConfig } from '../../hooks';
import { PrivateAuthenticationStore, PublicAuthenticationStore } from './interface';
import SSOPublicApp from './SSOPublicApp';
import SSOForkConsumer from './SSOForkConsumer';
import LoaderPage from './LoaderPage';
import { G_OAUTH_REDIRECT_PATH } from '../importAssistant/constants';

const ReplaceToBase = () => {
    document.location.replace(document.location.origin);
    return <Loader />;
};

interface Props {
    locales: TtagLocaleMap;
    PrivateApp: FunctionComponent<{ onLogout: () => void; locales: TtagLocaleMap }>;
}

const StandardSetup = ({ locales, PrivateApp }: Props) => {
    const { APP_NAME } = useConfig();

    const { UID, logout, login, getLocalID } = useAuthentication() as PublicAuthenticationStore &
        PrivateAuthenticationStore;

    if (UID) {
        const handleInactiveSession = () => {
            // If the session becomes inactive on first load, the child session has probably expired, so request to be forked
            if (isSSOMode) {
                return requestFork(APP_NAME, getLocalID?.());
            }
            logout();
        };
        return <PrivateApp locales={locales} onLogout={handleInactiveSession} />;
    }

    if (isSSOMode) {
        const handleInvalidFork = () => {
            // Fork invalid, so just fall back to the account page.
            return replaceUrl(getAppHref('/', APPS.PROTONACCOUNT));
        };
        const handleInactiveSession = (localID?: number) => {
            requestFork(APP_NAME, localID);
        };
        return (
            <Switch>
                <Route path={G_OAUTH_REDIRECT_PATH}>
                    <LoaderPage />
                </Route>
                <Route path={SSO_PATHS.FORK}>
                    <SSOForkConsumer
                        onEmptyFork={handleInactiveSession}
                        onInvalidFork={handleInvalidFork}
                        onLogin={login}
                    />
                </Route>
                <Route path="*">
                    <SSOPublicApp onLogin={login} onInactiveSession={handleInactiveSession} />
                </Route>
            </Switch>
        );
    }

    if (isStandaloneMode || document.location.pathname === '/') {
        return <StandalonePublicApp locales={locales} onLogin={async (data) => login(data)} />;
    }

    return <ReplaceToBase />;
};

export default StandardSetup;
