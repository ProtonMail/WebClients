import { signInWithAnotherDevicePush } from '@proton/account/signInWithAnotherDevice/signInWithAnotherDevicePush';
import type { AuthSession } from '@proton/components/containers/login/interface';
import { Product } from '@proton/shared/lib/ProductEnum';
import { pushForkSession } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { type OAuthLastAccess, getOAuthLastAccess } from '@proton/shared/lib/api/oauth';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import { getClientID, getProduct, isExtension } from '@proton/shared/lib/apps/helper';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import {
    getProduceForkUrl,
    produceExtensionFork,
    produceFork,
    produceOAuthFork,
} from '@proton/shared/lib/authentication/fork';
import type { PushForkResponse } from '@proton/shared/lib/authentication/interface';
import { APPS, type APP_NAMES, SSO_PATHS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import type { Api } from '@proton/shared/lib/interfaces';
import { getRequiresAddressSetup } from '@proton/shared/lib/keys/setupAddress';

import type { AuthDesktopState } from '../../public/AuthDesktop';
import type { AuthExtensionState } from '../../public/AuthExtension';
import type { Paths } from '../helper';
import { type ProduceForkData, SSOType } from './forkInterface';
import { getProductDisabledLoginResult } from './getProductDisabledResult';
import { getSetupAddressLoginResult } from './getSetupAddressLoginResult';
import type { LoginResult } from './interface';

// A set of products for which availability (access control) should be ignored and instead always allowed.
// This may be for apps which will never have a web app but for which forking should still be allowed and access control ignored.
const allowSet = new Set<Product>([Product.Authenticator]);

/**
 * Checks if the app is available to this user. It only does it based on the user's access control. Not based on the organization's access control
 * because we don't have the organization, and it's anyway done by the API later.
 */
const getIsAppAvailable = (app: APP_NAMES, session: AuthSession) => {
    // Convert the app into a product, because the app may be an app, extension, or desktop app etc. and available products are only apps.
    const product = getProduct(app);
    return (
        allowSet.has(product) ||
        getAvailableApps({
            user: session.data.User,
            context: 'app',
            isDocsHomepageAvailable: true,
        }).some((availableApp) => product === getProduct(availableApp))
    );
};

const getIsProductDisabledResult = (code: number) => {
    return [API_CUSTOM_ERROR_CODES.SSO_APPLICATION_INVALID, API_CUSTOM_ERROR_CODES.APPLICATION_BLOCKED].some(
        (errorCode) => errorCode === code
    );
};

export const getProduceForkLoginResult = async ({
    api: normalApi,
    data,
    session,
    paths,
}: {
    api: Api;
    data: ProduceForkData;
    session: AuthSession;
    paths: Paths;
}): Promise<LoginResult> => {
    const api = getUIDApi(session.data.UID, normalApi);

    if (data.type === SSOType.Proton) {
        const { forkParameters, desktopForkParameters, searchParameters } = data.payload;
        const { app } = forkParameters;

        // OAuth sessions are only allowed for the VPN browser extension at the moment. Throw a disallowed product error if a fork is attempted.
        if (session.data.persistedSession.source === SessionSource.Oauth && app !== APPS.PROTONVPNBROWSEREXTENSION) {
            return getProductDisabledLoginResult({ api, app, paths, session });
        }

        if (getRequiresAddressSetup(app, session.data.User)) {
            return getSetupAddressLoginResult({ session, app });
        }

        if (!getIsAppAvailable(app, session)) {
            return getProductDisabledLoginResult({ api, app, paths, session });
        }

        try {
            if (isExtension(app)) {
                const childClientID = getClientID(app);
                const { Selector: selector } = await api<PushForkResponse>(
                    pushForkSession({
                        ChildClientID: childClientID,
                        Independent: forkParameters.independent ? 1 : 0,
                    })
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
                    location: '/auth-ext',
                };
            }

            if (desktopForkParameters) {
                let result: AuthDesktopState['result'];
                try {
                    await signInWithAnotherDevicePush({
                        api,
                        qrCodePayload: desktopForkParameters.qrCodePayload,
                        keyPassword: session.data.keyPassword,
                    });
                    result = { type: 'success' };
                } catch (e) {
                    const apiError = getApiError(e);
                    // This specific error is handled in the outside catch handler
                    if (getIsProductDisabledResult(apiError.code)) {
                        throw e;
                    }
                    result = { type: 'error', errorMessage: getNonEmptyErrorMessage(e) };
                }
                const state: AuthDesktopState = { app, desktopForkParameters, result };
                return {
                    type: 'auth-desktop',
                    payload: state,
                    location: '/auth-desktop',
                };
            }

            const produceForkPayload = await produceFork({
                api,
                session: session.data,
                forkParameters,
            });
            const url = getProduceForkUrl(produceForkPayload, forkParameters, searchParameters);
            return {
                type: 'done',
                payload: {
                    session,
                    url,
                },
            };
        } catch (e) {
            const { code } = getApiError(e);
            if (getIsProductDisabledResult(code)) {
                return getProductDisabledLoginResult({ app: forkParameters.app, session, paths, api });
            }
            throw e;
        }
    }

    if (data.type === SSOType.OAuth) {
        const { payload } = data;
        const {
            Access: { Accepted },
        } = await api<{
            Access: OAuthLastAccess;
        }>(getOAuthLastAccess(payload.oauthData.clientID));
        if (Accepted) {
            const url = new URL(await produceOAuthFork({ api, oauthData: payload.oauthData }));
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
            location: SSO_PATHS.OAUTH_CONFIRM_FORK,
            payload: {
                data,
                session,
            },
        };
    }

    throw new Error('Unknown fork type');
};
