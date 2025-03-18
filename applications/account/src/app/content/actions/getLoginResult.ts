import type { AppIntent, AuthSession } from '@proton/components/containers/login/interface';
import { UNPAID_STATE } from '@proton/payments';
import { getAppHref, getExtension, getInvoicesPathname } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { getToApp } from '@proton/shared/lib/authentication/apps';
import { getShouldReAuth } from '@proton/shared/lib/authentication/fork';
import { type ProduceForkData, SSOType } from '@proton/shared/lib/authentication/fork/interface';
import { getOAuthSettingsUrl } from '@proton/shared/lib/authentication/fork/oauth2SettingsUrl';
import { getReturnUrl } from '@proton/shared/lib/authentication/returnUrl';
import { APPS, type APP_NAMES, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { joinPaths } from '@proton/shared/lib/helpers/url';
import type { Api } from '@proton/shared/lib/interfaces';
import { getEncryptedSetupBlob, getRequiresAddressSetup } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import type { AppSwitcherState } from '../../public/AppSwitcherContainer';
import { getReAuthState } from '../../public/ReAuthContainer';
import { getOrganization } from '../../public/organization';
import type { Paths } from '../helper';
import type { LocalRedirect } from '../localRedirect';
import { getProduceForkLoginResult } from './getProduceForkLoginResult';
import type { LoginResult } from './interface';

const getDefaultPath = (toApp: APP_NAMES) => {
    if (toApp === APPS.PROTONMAIL) {
        return '/inbox';
    }
    return '/';
};

export const addSignupSearchParams = (searchParams: URLSearchParams, { appIntent }: { appIntent?: AppIntent }) => {
    searchParams.append('welcome', 'true');
    if (appIntent?.ref !== undefined) {
        searchParams.append('ref', appIntent.ref);
    }
};

const getLocalRedirectWithApp = ({
    localRedirect: maybeLocalRedirect,
    session,
    toApp,
}: {
    localRedirect?: LocalRedirect;
    session: AuthSession;
    toApp: APP_NAMES;
}): LocalRedirect | undefined => {
    if (maybeLocalRedirect?.toApp) {
        return maybeLocalRedirect;
    }

    if (maybeLocalRedirect) {
        return {
            ...maybeLocalRedirect,
            location: {
                ...maybeLocalRedirect.location,
                pathname: joinPaths(getSlugFromApp(toApp), maybeLocalRedirect.location.pathname),
            },
            toApp: toApp,
        };
    }

    // Handle special case going for internal vpn on account settings.
    if (toApp === APPS.PROTONVPN_SETTINGS) {
        const url = new URL(session.flow === 'signup' ? '/vpn-apps?prompt=true' : '/', window.location.origin);
        return {
            location: {
                pathname: joinPaths(getSlugFromApp(toApp), url.pathname),
                hash: url.hash,
                search: url.search,
            },
            toApp: toApp,
        };
    }
};

const getUrlFromLocation = ({
    location,
    toApp,
    context,
    localID,
}: {
    location: LocalRedirect['location'];
    toApp: APP_NAMES;
    context: LocalRedirect['context'];
    localID: number;
}) => {
    const url = new URL(getAppHref(location.pathname, toApp, context === 'public' ? undefined : localID));
    url.search = location.search;
    url.hash = location.hash;
    return url;
};

const getRedirectUrl = ({
    localRedirect: maybeLocalRedirect,
    session,
    initialSearchParams,
    toApp,
}: {
    localRedirect?: LocalRedirect;
    session: AuthSession;
    initialSearchParams: URLSearchParams;
    toApp: APP_NAMES;
}) => {
    const localID = session.data.LocalID;

    const localRedirect = getLocalRedirectWithApp({ localRedirect: maybeLocalRedirect, session, toApp });
    if (localRedirect) {
        return getUrlFromLocation({
            location: localRedirect.location,
            toApp: APPS.PROTONACCOUNT,
            context: localRedirect.context,
            localID,
        });
    }

    const returnUrl = getReturnUrl(initialSearchParams);
    if (returnUrl) {
        return getUrlFromLocation({ location: returnUrl.location, toApp, context: returnUrl.context, localID });
    }

    const path = getDefaultPath(toApp);
    const url = new URL(getAppHref(path, toApp, localID));
    if (session.flow === 'signup') {
        addSignupSearchParams(url.searchParams, { appIntent: session.appIntent });
    }

    return url;
};

export const getLoginResult = async ({
    api,
    session,
    forkState,
    localRedirect: maybeLocalRedirect,
    initialSearchParams,
    preAppIntent: maybePreAppIntent,
    paths,
}: {
    api: Api;
    session: AuthSession;
    forkState?: ProduceForkData | null;
    localRedirect?: LocalRedirect;
    initialSearchParams: URLSearchParams;
    preAppIntent?: APP_NAMES;
    paths: Paths;
}): Promise<LoginResult> => {
    const {
        loginPassword,
        data: { User: user, clientKey, persistedSession },
        appIntent,
    } = session;

    invokeInboxDesktopIPC({ type: 'userLogin' }).catch(noop);

    const maybeToApp = appIntent?.app || maybePreAppIntent;

    // In any forking scenario, ignore the app switcher
    if (!maybeToApp && !forkState) {
        const organization = await getOrganization({ session, api }).catch(noop);
        const appSwitcherState: AppSwitcherState = {
            session: { ...session, data: { ...session.data, Organization: organization } },
        };
        return {
            type: 'app-switcher',
            location: { pathname: paths.appSwitcher },
            payload: appSwitcherState,
        };
    }

    const forkParameters = forkState?.type === SSOType.Proton ? forkState.payload.forkParameters : undefined;

    if (
        // Reauth is only triggered through the switch flow as in other scenarios the user always enters their password
        session.flow === 'switch' &&
        getShouldReAuth(forkParameters, session)
    ) {
        return {
            type: 'reauth',
            location: { pathname: paths.reauth },
            payload: getReAuthState(forkParameters, session),
        };
    }

    const toApp = getToApp(maybeToApp, user);

    // OAuth session are only allowed for the VPN browser extension at the moment. Go to the restricted settings view.
    if (persistedSession.source === SessionSource.Oauth && toApp !== APPS.PROTONVPNBROWSEREXTENSION) {
        const url = getOAuthSettingsUrl(session.data.LocalID);
        return {
            type: 'done',
            payload: {
                session,
                url,
            },
        };
    }

    if (
        getRequiresAddressSetup(toApp, user) &&
        !maybeLocalRedirect?.location.pathname.includes(SETUP_ADDRESS_PATH) &&
        maybeLocalRedirect?.context !== 'public'
    ) {
        const blob =
            loginPassword && clientKey ? await getEncryptedSetupBlob(clientKey, loginPassword).catch(noop) : undefined;
        const params = new URLSearchParams();
        params.set('to', toApp);
        params.set('from', 'switch');
        const path = `${SETUP_ADDRESS_PATH}?${params.toString()}#${blob || ''}`;
        const url = new URL(getAppHref(path, APPS.PROTONACCOUNT, session.data.LocalID));
        return {
            type: 'done',
            payload: {
                session,
                url,
            },
        };
    }

    // Upon login, if user is delinquent, the fork is aborted and the user is redirected to invoices
    if (user.Delinquent >= UNPAID_STATE.DELINQUENT) {
        const path = joinPaths(getSlugFromApp(toApp), getInvoicesPathname());
        const url = new URL(getAppHref(path, APPS.PROTONACCOUNT, session.data.LocalID));
        return {
            type: 'done',
            payload: {
                session,
                url,
            },
        };
    }

    // Fork early to extensions because they don't need to follow the signup logic
    if (forkState?.type === SSOType.Proton && getExtension(forkState.payload.forkParameters.app)) {
        return getProduceForkLoginResult({
            data: {
                type: SSOType.Proton,
                payload: { forkParameters: forkState.payload.forkParameters },
            },
            session,
            api,
            paths,
        });
    }

    if (forkState?.type === SSOType.OAuth) {
        return getProduceForkLoginResult({
            data: {
                type: SSOType.OAuth,
                payload: { oauthData: forkState.payload.oauthData },
            },
            session,
            api,
            paths,
        });
    }

    if (forkState?.type === SSOType.Proton) {
        const searchParameters = new URLSearchParams();
        if (session.flow === 'signup') {
            addSignupSearchParams(searchParameters, { appIntent });
        }
        return getProduceForkLoginResult({
            data: {
                type: SSOType.Proton,
                payload: {
                    searchParameters,
                    forkParameters: forkState.payload.forkParameters,
                },
            },
            session,
            api,
            paths,
        });
    }

    const url = getRedirectUrl({
        localRedirect: maybeLocalRedirect,
        session,
        initialSearchParams,
        toApp,
    });

    return {
        type: 'done',
        payload: {
            session,
            url,
        },
    };
};
