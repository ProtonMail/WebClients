import { OfflineKey } from '@proton/shared/lib/authentication/offlineKey';
import { getPathFromLocation } from '@proton/shared/lib/helpers/url';
import getRandomString from '@proton/utils/getRandomString';
import noop from '@proton/utils/noop';

import { pullForkSession, pushForkSession, revoke, setCookies } from '../api/auth';
import { OAuthForkResponse, postOAuthFork } from '../api/oauth';
import { getUser } from '../api/user';
import { getAppHref, getClientID } from '../apps/helper';
import { ExtensionMessageResponse, sendExtensionMessage } from '../browser/extension';
import { APPS, APP_NAMES, SSO_PATHS } from '../constants';
import { withAuthHeaders, withUIDHeaders } from '../fetch/headers';
import { replaceUrl } from '../helpers/browser';
import { encodeBase64URL, uint8ArrayToString } from '../helpers/encoding';
import { Api, User, User as tsUser } from '../interfaces';
import { Extension, FORK_TYPE } from './ForkInterface';
import { getKey } from './cryptoHelper';
import { InvalidForkConsumeError, InvalidPersistentSessionError } from './error';
import { PullForkResponse, PushForkResponse } from './interface';
import { persistSession, resumeSession } from './persistedSessionHelper';
import { getForkDecryptedBlob, getForkEncryptedBlob } from './sessionForkBlob';
import {
    getValidatedApp,
    getValidatedForkType,
    getValidatedLocalID,
    getValidatedRawKey,
} from './sessionForkValidation';

interface ExtensionForkPayloadArguments {
    selector: string;
    session: {
        keyPassword?: string | undefined;
        offlineKey: OfflineKey | undefined;
        persistent: boolean;
        trusted: boolean;
    };
    forkParameters: ProduceForkParameters;
}

interface ExtensionForkPayload {
    selector: string;
    keyPassword: string | undefined;
    offlineKey: OfflineKey | undefined;
    persistent: boolean;
    trusted: boolean;
    state: string;
}

export type ExtensionForkResultPayload = {
    title?: string;
    message: string;
};

export type ExtensionForkResult = ExtensionMessageResponse<ExtensionForkResultPayload>;
export type ExtensionForkMessage = { type: 'fork'; payload: ExtensionForkPayload };
export type ExtensionAuthenticatedMessage = { type: 'auth-ext' };

export const produceExtensionFork = async (options: {
    extension: Extension;
    payload: ExtensionForkPayloadArguments;
}): Promise<ExtensionForkResult> => {
    const payload: ExtensionForkPayload = {
        selector: options.payload.selector,
        keyPassword: options.payload.session.keyPassword,
        offlineKey: options.payload.session.offlineKey,
        persistent: options.payload.session.persistent,
        trusted: options.payload.session.trusted,
        state: options.payload.forkParameters.state,
    };
    return sendExtensionMessage<ExtensionForkMessage, ExtensionForkResultPayload>(
        { type: 'fork', payload },
        {
            extensionId: options.extension.ID,
            onFallbackMessage: (evt) =>
                evt.data.fork === 'success' /* support legacy VPN fallback message */
                    ? {
                          type: 'success',
                          payload: evt.data.payload,
                      }
                    : undefined,
        }
    );
};

interface ForkState {
    url: string;
}

export const requestFork = ({
    fromApp,
    localID,
    reason,
    forkType,
    payloadType,
    payloadVersion,
}: {
    fromApp: APP_NAMES;
    localID?: number;
    forkType?: FORK_TYPE;
    reason?: 'signout' | 'session-expired';
    payloadType?: 'offline';
    payloadVersion?: 2;
}) => {
    const state = encodeBase64URL(uint8ArrayToString(crypto.getRandomValues(new Uint8Array(32))));

    const searchParams = new URLSearchParams();
    searchParams.append('app', fromApp);
    searchParams.append('state', state);
    if (localID !== undefined) {
        searchParams.append('u', `${localID}`);
    }
    if (forkType !== undefined) {
        searchParams.append('t', forkType);
    }
    if (reason !== undefined) {
        searchParams.append('reason', reason);
    }
    if (payloadType !== undefined) {
        searchParams.append('pt', payloadType);
    }
    if (payloadVersion !== undefined) {
        searchParams.append('pv', `${payloadVersion}`);
    }

    const url = forkType === FORK_TYPE.SWITCH ? getAppHref('/', fromApp) : window.location.href;
    const forkStateData: ForkState = { url };
    sessionStorage.setItem(`f${state}`, JSON.stringify(forkStateData));

    return replaceUrl(getAppHref(`${SSO_PATHS.AUTHORIZE}?${searchParams.toString()}`, APPS.PROTONACCOUNT));
};

export interface OAuthProduceForkParameters {
    clientID: string;
    oaSession: string;
}

interface ProduceOAuthForkArguments {
    api: Api;
    UID: string;
    oauthData: OAuthProduceForkParameters;
}

export const produceOAuthFork = async ({ api, UID, oauthData: { oaSession, clientID } }: ProduceOAuthForkArguments) => {
    const {
        Data: { RedirectUri },
    } = await api<{ Data: OAuthForkResponse }>(
        withUIDHeaders(
            UID,
            postOAuthFork({
                ClientID: clientID,
                OaSession: oaSession,
            })
        )
    );

    return replaceUrl(RedirectUri);
};

export interface ProduceForkParameters {
    state: string;
    app: APP_NAMES;
    plan?: string;
    independent: boolean;
    forkType?: FORK_TYPE;
    prompt: 'login' | undefined;
    promptType: 'offline-bypass' | 'offline' | 'default';
    payloadType: 'offline' | 'default';
    payloadVersion: 1 | 2;
}

export interface ProduceForkParametersFull extends ProduceForkParameters {
    localID: number;
}

export const getProduceForkParameters = (): Omit<ProduceForkParametersFull, 'localID' | 'app'> &
    Partial<Pick<ProduceForkParametersFull, 'localID' | 'app'>> => {
    const searchParams = new URLSearchParams(window.location.search);
    const app = searchParams.get('app') || '';
    const state = searchParams.get('state') || '';
    const localID = searchParams.get('u') || '';
    const forkType = searchParams.get('t') || '';
    const prompt = searchParams.get('prompt') || '';
    const plan = searchParams.get('plan') || '';
    const independent = searchParams.get('independent') || '0';
    const payloadType = (() => {
        const value = searchParams.get('pt') || '';
        if (value === 'offline') {
            return value;
        }
        return 'default';
    })();
    const payloadVersion = (() => {
        const value = Number(searchParams.get('pv') || '1');
        if (value === 1 || value === 2) {
            return value;
        }
        return 1;
    })();
    const promptType = (() => {
        const value = searchParams.get('promptType') || '';
        if (value === 'offline' || value === 'offline-bypass') {
            return value;
        }
        return 'default';
    })();

    return {
        state: state.slice(0, 100),
        localID: getValidatedLocalID(localID),
        app: getValidatedApp(app),
        forkType: getValidatedForkType(forkType),
        prompt: prompt === 'login' ? 'login' : undefined,
        promptType,
        plan,
        independent: independent === '1' || independent === 'true',
        payloadType,
        payloadVersion,
    };
};

export const getRequiredForkParameters = (
    forkParameters: ReturnType<typeof getProduceForkParameters>
): forkParameters is ProduceForkParametersFull => {
    return Boolean(forkParameters.app && forkParameters.state);
};

export const getCanUserReAuth = (user: User) => {
    return !user.Flags.sso && !user.OrganizationPrivateKey;
};

export const getShouldReAuth = (
    forkParameters: Pick<ProduceForkParameters, 'prompt' | 'promptType'>,
    authSession: {
        User: User;
        offlineKey: OfflineKey | undefined;
    }
) => {
    const shouldReAuth = forkParameters.prompt === 'login';
    if (!shouldReAuth) {
        return false;
    }
    if (!getCanUserReAuth(authSession.User)) {
        return false;
    }
    if (forkParameters.promptType === 'offline-bypass' && authSession.offlineKey) {
        return false;
    }
    return true;
};

interface ProduceForkArguments {
    api: Api;
    session: {
        UID: string;
        keyPassword?: string;
        offlineKey: OfflineKey | undefined;
        persistent: boolean;
        trusted: boolean;
    };
    forkParameters: ProduceForkParameters;
}

export const produceFork = async ({
    api,
    session: { UID, keyPassword, offlineKey, persistent, trusted },
    forkParameters: { state, app, independent, forkType, payloadType, payloadVersion },
}: ProduceForkArguments) => {
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    const base64StringKey = encodeBase64URL(uint8ArrayToString(rawKey));
    const encryptedPayload = await (async () => {
        const forkData = (() => {
            if (payloadType === 'offline' && offlineKey && offlineKey.salt && offlineKey.password) {
                return {
                    type: 'offline',
                    keyPassword: keyPassword || '',
                    offlineKeyPassword: offlineKey.password,
                    offlineKeySalt: offlineKey.salt,
                } as const;
            }
            return { type: 'default', keyPassword: keyPassword || '' } as const;
        })();
        return {
            blob: await getForkEncryptedBlob(await getKey(rawKey), forkData, payloadVersion),
            payloadType: forkData.type,
            payloadVersion,
        };
    })();
    const childClientID = getClientID(app);
    const { Selector } = await api<PushForkResponse>(
        withUIDHeaders(
            UID,
            pushForkSession({
                Payload: encryptedPayload.blob,
                ChildClientID: childClientID,
                Independent: independent ? 1 : 0,
            })
        )
    );

    const toConsumeParams = new URLSearchParams();
    toConsumeParams.append('selector', Selector);
    toConsumeParams.append('state', state);
    toConsumeParams.append('sk', base64StringKey);
    if (persistent) {
        toConsumeParams.append('p', '1');
    }
    if (trusted) {
        toConsumeParams.append('tr', '1');
    }
    if (forkType !== undefined) {
        toConsumeParams.append('t', forkType);
    }
    if (encryptedPayload.payloadVersion !== undefined) {
        toConsumeParams.append('pv', `${encryptedPayload.payloadVersion}`);
    }
    if (encryptedPayload.payloadType !== undefined) {
        toConsumeParams.append('pt', `${encryptedPayload.payloadType}`);
    }

    return replaceUrl(getAppHref(`${SSO_PATHS.FORK}#${toConsumeParams.toString()}`, app));
};

const getForkStateData = (data?: string | null): ForkState | undefined => {
    if (!data) {
        return undefined;
    }
    try {
        const { url } = JSON.parse(data);
        return {
            url,
        };
    } catch (e: any) {
        return undefined;
    }
};

export const getConsumeForkParameters = () => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const selector = hashParams.get('selector') || '';
    const state = hashParams.get('state') || '';
    const base64StringKey = hashParams.get('sk') || '';
    const type = hashParams.get('t') || '';
    const persistent = hashParams.get('p') || '';
    const trusted = hashParams.get('tr') || '';
    const payloadVersion = hashParams.get('pv') || '';
    const payloadType = hashParams.get('pt') || '';

    return {
        state: state.slice(0, 100),
        selector,
        key: base64StringKey.length ? getValidatedRawKey(base64StringKey) : undefined,
        forkType: getValidatedForkType(type),
        persistent: persistent === '1',
        trusted: trusted === '1',
        payloadVersion: payloadVersion === '2' ? 2 : 1,
        payloadType: payloadType === 'offline' ? payloadType : 'default',
    } as const;
};

export const removeHashParameters = () => {
    window.location.hash = '';
};

interface ConsumeForkArguments {
    api: Api;
    selector: string;
    state: string;
    key: Uint8Array;
    persistent: boolean;
    trusted: boolean;
    payloadVersion: 1 | 2;
    mode: 'sso' | 'standalone';
}

export const consumeFork = async ({
    selector,
    api,
    state,
    key,
    persistent,
    trusted,
    payloadVersion,
    mode,
}: ConsumeForkArguments) => {
    const stateData = getForkStateData(sessionStorage.getItem(`f${state}`));
    if (!stateData) {
        throw new InvalidForkConsumeError(`Missing state ${state}`);
    }
    const { url: previousUrl } = stateData;
    if (!previousUrl) {
        throw new InvalidForkConsumeError('Missing url');
    }
    const url = new URL(previousUrl);
    const path = getPathFromLocation(url);

    const { UID, AccessToken, RefreshToken, Payload, LocalID } = await api<PullForkResponse>(pullForkSession(selector));
    const authApi = <T>(config: any) => api<T>(withAuthHeaders(UID, AccessToken, config));

    try {
        // Resume and use old session if it exists
        const validatedSession = await resumeSession(api, LocalID);

        // Revoke the discarded forked session
        await authApi(revoke({ Child: 1 })).catch(noop);

        return {
            ...validatedSession,
            path,
        } as const;
    } catch (e: any) {
        // If existing session is invalid. Fall through to continue using the new fork.
        if (!(e instanceof InvalidPersistentSessionError)) {
            throw e;
        }
    }

    let keyPassword = '';
    let forkedOfflineKey: OfflineKey | undefined;

    if (Payload) {
        try {
            const data = await getForkDecryptedBlob(await getKey(key), Payload, payloadVersion);
            keyPassword = data?.keyPassword || '';
            if (data?.type === 'offline') {
                forkedOfflineKey = {
                    password: data.offlineKeyPassword,
                    salt: data.offlineKeySalt,
                };
            }
        } catch (e: any) {
            throw new InvalidForkConsumeError('Failed to decrypt payload');
        }
    }

    const User = await authApi<{ User: tsUser }>(getUser()).then(({ User }) => User);

    const result = {
        User,
        UID,
        LocalID,
        keyPassword,
        persistent,
        trusted,
        AccessToken,
        RefreshToken,
    };

    const { clientKey, offlineKey } = await persistSession({
        api: authApi,
        ...result,
        clearKeyPassword: '',
        offlineKey: forkedOfflineKey,
        mode,
    });
    await authApi(setCookies({ UID, RefreshToken, State: getRandomString(24), Persistent: persistent }));

    return {
        ...result,
        path,
        clientKey,
        offlineKey,
    } as const;
};
