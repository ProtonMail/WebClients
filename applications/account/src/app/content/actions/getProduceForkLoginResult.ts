import type { AuthSession } from '@proton/components/containers/login/interface';
import { pushForkSession } from '@proton/shared/lib/api/auth';
import { type OAuthLastAccess, getOAuthLastAccess } from '@proton/shared/lib/api/oauth';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import { getClientID, getProduct, isExtension } from '@proton/shared/lib/apps/helper';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import {
    produceExtensionFork,
    produceFork,
    produceForkConsumption,
    produceOAuthFork,
} from '@proton/shared/lib/authentication/fork';
import { type ProduceForkData, SSOType } from '@proton/shared/lib/authentication/fork/interface';
import type { PushForkResponse } from '@proton/shared/lib/authentication/interface';
import { APPS, type APP_NAMES, SSO_PATHS } from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api } from '@proton/shared/lib/interfaces';
import { getRequiresAddressSetup } from '@proton/shared/lib/keys/setupAddress';

import type { AuthExtensionState } from '../../public/AuthExtension';
import type { Paths } from '../helper';
import { getProductDisabledLoginResult } from './getProductDisabledResult';
import { getSetupAddressLoginResult } from './getSetupAddressLoginResult';
import type { LoginResult } from './interface';

/**
 * Checks if the app is available to this user. It only does it based on the user's access control. Not based on the organization's access control
 * because we don't have the organization, and it's anyway done by the API later.
 */
const getIsAppAvailable = (app: APP_NAMES, session: AuthSession) => {
    // Convert the app into a product, because the app may be an app, extension, or desktop app etc. and available products are only apps.
    const product = getProduct(app);
    return getAvailableApps({
        user: session.data.User,
        context: 'app',
        // Access control can be disabled when forking a session from Account FE because the API drives it
        isAccessControlEnabled: false,
        // The *lumo available* and *docs homepage* feature flag can always be true because we don't limit
        // access to them from the Account FE when forking a session
        isLumoAvailable: true,
        isDocsHomepageAvailable: true,
    }).some((availableApp) => product === getProduct(availableApp));
};

export const getProduceForkLoginResult = async ({
    api,
    data,
    session,
    paths,
}: {
    api: Api;
    data: ProduceForkData;
    session: AuthSession;
    paths: Paths;
}): Promise<LoginResult> => {
    if (data.type === SSOType.Proton) {
        const { forkParameters, searchParameters } = data.payload;
        const { app } = forkParameters;

        // OAuth session are only allowed for the VPN browser extension at the moment. Throw a disallowed product error if a fork is attempted.
        if (session.data.persistedSession.source === SessionSource.Oauth && app !== APPS.PROTONVPNBROWSEREXTENSION) {
            return getProductDisabledLoginResult({ api, app, paths, session });
        }

        if (getRequiresAddressSetup(app, session.data.User)) {
            return getSetupAddressLoginResult({ session, app });
        }

        if (!getIsAppAvailable(app, session)) {
            return getProductDisabledLoginResult({ api, app, paths, session });
        }

        if (isExtension(app)) {
            const childClientID = getClientID(app);
            const { Selector: selector } = await api<PushForkResponse>(
                withUIDHeaders(
                    session.data.UID,
                    pushForkSession({
                        ChildClientID: childClientID,
                        Independent: forkParameters.independent ? 1 : 0,
                    })
                )
            );
            const result = await produceExtensionFork({
                app,
                payload: {
                    selector,
                    session: session.data,
                    forkParameters,
                },
            });

            const state: AuthExtensionState = { ...result, app };
            return {
                type: 'auth-ext',
                payload: state,
                location: {
                    pathname: '/auth-ext',
                },
            };
        }

        const produceForkPayload = await produceFork({
            api,
            session: session.data,
            forkParameters,
        });
        const url = new URL(produceForkConsumption(produceForkPayload, searchParameters));
        return {
            type: 'done',
            payload: {
                session,
                url,
            },
        };
    }

    if (data.type === SSOType.OAuth) {
        const { payload } = data;
        const UID = session.data.UID;
        const {
            Access: { Accepted },
        } = await api<{
            Access: OAuthLastAccess;
        }>(withUIDHeaders(UID, getOAuthLastAccess(payload.oauthData.clientID)));
        if (Accepted) {
            const url = new URL(await produceOAuthFork({ api, oauthData: payload.oauthData, UID }));
            return {
                type: 'done',
                payload: {
                    session,
                    url,
                },
            };
        }
        return {
            type: 'confirm-oauth',
            location: {
                pathname: SSO_PATHS.OAUTH_CONFIRM_FORK,
            },
            payload: {
                data,
                session,
            },
        };
    }

    throw new Error('Unknown fork type');
};
