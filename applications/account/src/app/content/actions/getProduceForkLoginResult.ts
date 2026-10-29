import { signInWithAnotherDevicePush } from '@proton/account/signInWithAnotherDevice/signInWithAnotherDevicePush';
import { getForkCodeLocation, pushForkSession } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { type OAuthLastAccess, getOAuthLastAccess } from '@proton/shared/lib/api/oauth';
import { getClientID, isExtension } from '@proton/shared/lib/apps/helper';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { produceExtensionFork } from '@proton/shared/lib/authentication/fork/extension';
import { getValidatedProtonProtocol } from '@proton/shared/lib/authentication/fork/getValidatedProtonProtocol';
import { produceOAuthFork } from '@proton/shared/lib/authentication/fork/oauth';
import { getProduceForkUrl, getShouldReAuth, produceFork } from '@proton/shared/lib/authentication/fork/produce';
import type { ForkCodeLocation, PushForkResponse } from '@proton/shared/lib/authentication/interface';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { getRequiresAddressSetup, getRequiresProtonAddressFromAdmin } from '@proton/shared/lib/keys/setupAddress';

import type { AuthDesktopState } from '../../public/AuthDesktop';
import type { AuthExtensionState } from '../../public/AuthExtension';
import { getReAuthState } from '../../public/reauthContainerState';
import type { AuthSession } from '../authSession';
import type { Paths } from '../helper';
import { hasInterruption } from '../interruptions';
import { type ProduceForkData, SSOType } from './forkInterface';
import { getDeepLinkLoginResult } from './getDeepLinkLoginResult';
import { getProductDisabledLoginResult } from './getProductDisabledResult';
import { getSetupAddressLoginResult } from './getSetupAddressLoginResult';
import type { LoginResult } from './interface';

const getIsProductDisabledResult = (code: number) => {
    return [
        API_CUSTOM_ERROR_CODES.SSO_APPLICATION_INVALID,
        API_CUSTOM_ERROR_CODES.APPLICATION_BLOCKED_BY_ORG_ADMIN,
        API_CUSTOM_ERROR_CODES.APPLICATION_BLOCKED_BY_ACCESS_RESTRICTION,
    ].some((errorCode) => errorCode === code);
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
        const { app, redirectUrl } = forkParameters;

        if (
            // Reauth is only triggered through the switch or auto flow as in other scenarios the user enters their password
            (session.flow === 'switch' || session.flow === 'auto-resume') &&
            // The prompt comes from the fork url and does not change between passes, so without this the
            // session would be sent back to reauth every time it comes back through here
            !hasInterruption(session, 'reauth') &&
            getShouldReAuth(forkParameters, session)
        ) {
            return {
                type: 'reauth',
                location: paths.reauth,
                payload: getReAuthState(forkParameters, session),
            };
        }

        // OAuth sessions are only allowed for the VPN browser extension at the moment. Throw a disallowed product error if a fork is attempted.
        if (session.data.persistedSession.source === SessionSource.Oauth && app !== APPS.PROTONVPNBROWSEREXTENSION) {
            return getProductDisabledLoginResult({ api, app, paths, session });
        }

        if (session.data.persistedSession.source === SessionSource.Msp) {
            return getProductDisabledLoginResult({ api, app, paths, session });
        }

        if (
            getRequiresAddressSetup(app, session.data.User) ||
            // Where they're told to ask their administrator
            getRequiresProtonAddressFromAdmin(app, session.data.User)
        ) {
            return getSetupAddressLoginResult({ session, app });
        }

        try {
            if (isExtension(app)) {
                const childClientID = forkParameters.childClientID || getClientID(app);
                const { Selector: selector } = await api<PushForkResponse>(
                    pushForkSession({
                        ChildClientID: childClientID,
                        Independent: forkParameters.independent ? 1 : 0,
                        ForkChallenge: forkParameters.forkChallenge,
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
                if (!hasInterruption(session, 'desktop-fork-consent')) {
                    const { userCode, childClientId } = desktopForkParameters.qrCodePayload;
                    // Where the device showing the code is, for the user to check; the consent works without it
                    const location = await api<ForkCodeLocation>({ ...getForkCodeLocation(userCode), silence: true })
                        .then(({ IP, CountryCode }) => ({ IP, CountryCode }))
                        .catch(() => undefined);
                    return {
                        type: 'desktop-fork-consent',
                        location: '/auth-desktop/confirm',
                        payload: { session, app, childClientId, location },
                    };
                }

                let result: AuthDesktopState['result'];
                try {
                    await signInWithAnotherDevicePush({
                        api,
                        qrCodePayload: desktopForkParameters.qrCodePayload,
                        keyPassword: session.data.keyPassword,
                        offlineKey: session.data.offlineKey,
                        forkParameters: {
                            payloadVersion: forkParameters.payloadVersion,
                            payloadType: forkParameters.payloadType,
                        },
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

            if (!hasInterruption(session, 'desktop-fork-consent') && redirectUrl?.consent === 'desktop') {
                return {
                    type: 'desktop-fork-consent',
                    location: '/auth-desktop/confirm',
                    payload: { session, app, childClientId: forkParameters.childClientID || getClientID(app) },
                };
            }

            if (!hasInterruption(session, 'fork-redirect-consent') && redirectUrl?.consent === 'redirect') {
                return {
                    type: 'fork-redirect-consent',
                    location: SSO_PATHS.AUTHORIZE_REDIRECT_CONSENT,
                    payload: {
                        session,
                        redirectUrl: redirectUrl.url.href,
                    },
                };
            }

            const produceForkPayload = await produceFork({
                api,
                session: session.data,
                forkParameters,
            });
            const url = getProduceForkUrl(produceForkPayload, forkParameters, searchParameters);

            if (getValidatedProtonProtocol(app, url.href)) {
                return getDeepLinkLoginResult(app, url.href, forkParameters.childClientID || getClientID(app));
            }

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
        if (!hasInterruption(session, 'oauth-consent')) {
            const {
                Access: { Accepted },
            } = await api<{
                Access: OAuthLastAccess;
            }>(getOAuthLastAccess(payload.oauthData.clientID));
            if (!Accepted) {
                return {
                    type: 'oauth-consent',
                    location: SSO_PATHS.OAUTH_AUTHORIZE_CONSENT,
                    payload: {
                        data,
                        session,
                    },
                };
            }
        }
        const url = new URL(await produceOAuthFork({ api, oauthData: payload.oauthData }));
        return {
            type: 'done',
            payload: {
                session,
                url,
            },
        };
    }

    throw new Error('Unknown fork type');
};
