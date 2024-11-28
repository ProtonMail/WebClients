import type { OnLoginCallbackArguments } from '@proton/components/containers/app/interface';
import type { AppIntent, AuthSession } from '@proton/components/containers/login/interface';
import { UNPAID_STATE } from '@proton/payments/core/constants';
import { getOrganization as getOrganizationConfig } from '@proton/shared/lib/api/organization';
import { getAppHref, getExtension, getInvoicesPathname } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { getToApp } from '@proton/shared/lib/authentication/apps';
import { getCanUserReAuth, getReturnUrl, getShouldReAuth } from '@proton/shared/lib/authentication/fork';
import { APPS, type APP_NAMES, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { joinPaths } from '@proton/shared/lib/helpers/url';
import type { Api, Organization } from '@proton/shared/lib/interfaces';
import { getEncryptedSetupBlob, getRequiresAddressSetup } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import type { AppSwitcherState } from '../../public/AppSwitcherContainer';
import type { ReAuthState } from '../../public/ReAuthContainer';
import { type ProduceForkData, SSOType } from '../fork/interface';
import type { Paths } from '../helper';
import type { LocalRedirect } from '../localRedirect';
import { getLocalRedirect } from './getLocalRedirect';
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

const getRedirectUrl = ({
    localRedirect,
    session,
    initialSearchParams,
    toApp,
}: {
    localRedirect?: LocalRedirect;
    session: AuthSession;
    initialSearchParams: URLSearchParams;
    toApp: APP_NAMES;
}) => {
    const LocalID = session.LocalID;

    if (localRedirect) {
        const path = localRedirect.path || '/';
        return new URL(getAppHref(path, APPS.PROTONACCOUNT, LocalID));
    }

    const returnUrl = getReturnUrl(initialSearchParams);
    if (returnUrl) {
        const url = new URL(
            getAppHref(returnUrl.pathname, toApp, returnUrl.context === 'private' ? LocalID : undefined)
        );
        url.search = returnUrl.search;
        url.hash = returnUrl.hash;
        return url;
    }

    const path = getDefaultPath(toApp);
    const url = new URL(getAppHref(path, toApp, LocalID));
    if (session.flow === 'signup') {
        addSignupSearchParams(url.searchParams, { appIntent: session.appIntent });
    }

    return url;
};

const getOrganization = async ({ session, api }: { session: OnLoginCallbackArguments; api: Api }) => {
    if (!session.User.Subscribed) {
        return undefined;
    }
    return api<{
        Organization: Organization;
    }>(withUIDHeaders(session.UID, getOrganizationConfig())).then(({ Organization }) => Organization);
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
    const { loginPassword, clientKey, User: user, appIntent } = session;

    invokeInboxDesktopIPC({ type: 'userLogin' }).catch(noop);

    const maybeToApp = appIntent?.app || maybePreAppIntent;

    // In any forking scenario, ignore the app switcher
    if (!maybeToApp && !forkState) {
        const organization = await getOrganization({ session, api }).catch(noop);
        const appSwitcherState: AppSwitcherState = {
            session: { ...session, Organization: organization },
        };
        return {
            type: 'app-switcher',
            pathname: paths.appSwitcher,
            payload: appSwitcherState,
        };
    }

    if (
        // Reauth is only triggered through the switch flow as in other scenarios the user always enters their password
        session.flow === 'switch' &&
        getCanUserReAuth(session.User) &&
        (session.prompt === 'login' ||
            (forkState?.type === SSOType.Proton && getShouldReAuth(forkState.payload.forkParameters, session)))
    ) {
        const reAuthState: ReAuthState = {
            session,
            reAuthType:
                forkState && forkState.type === SSOType.Proton
                    ? forkState.payload.forkParameters.promptType
                    : 'default',
        };
        return {
            type: 'reauth',
            pathname: paths.reauth,
            payload: reAuthState,
        };
    }

    const toApp = getToApp(maybeToApp, user);
    const localRedirect = getLocalRedirect({ localRedirect: maybeLocalRedirect, session, toApp });

    if (getRequiresAddressSetup(toApp, user) && !localRedirect?.path.includes(SETUP_ADDRESS_PATH)) {
        const blob =
            loginPassword && clientKey ? await getEncryptedSetupBlob(clientKey, loginPassword).catch(noop) : undefined;
        const params = new URLSearchParams();
        params.set('to', toApp);
        params.set('from', 'switch');
        const path = `${SETUP_ADDRESS_PATH}?${params.toString()}#${blob || ''}`;
        const url = new URL(getAppHref(path, APPS.PROTONACCOUNT, session.LocalID));
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
        const url = new URL(getAppHref(path, APPS.PROTONACCOUNT, session.LocalID));
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

    const url = getRedirectUrl({ localRedirect, session, initialSearchParams, toApp });

    return {
        type: 'done',
        payload: {
            session,
            url,
        },
    };
};
