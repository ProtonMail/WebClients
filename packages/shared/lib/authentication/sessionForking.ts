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
import { Api, User as tsUser } from '../interfaces';
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

interface ExtensionForkPayload {
    selector: string;
    keyPassword: string | undefined;
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

export const produceExtensionFork = async ({
    extension,
    payload,
}: {
    extension: Extension;
    payload: ExtensionForkPayload;
}): Promise<ExtensionForkResult> =>
    sendExtensionMessage<ExtensionForkMessage, ExtensionForkResultPayload>(
        { type: 'fork', payload },
        {
            extensionId: extension.ID,
            onFallbackMessage: (evt) =>
                evt.data.fork === 'success' /* support legacy VPN fallback message */
                    ? {
                          type: 'success',
                          payload: evt.data.payload,
                      }
                    : undefined,
        }
    );

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

interface ProduceOAuthForkArguments extends OAuthProduceForkParameters {
    api: Api;
    UID: string;
}

export const produceOAuthFork = async ({ api, UID, oaSession, clientID }: ProduceOAuthForkArguments) => {
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
    payloadType: 'offline' | 'default';
    payloadVersion: 1 | 2;
}

export interface ProduceForkParametersFull extends ProduceForkParameters {
    localID: number;
}

export const getProduceForkParameters = (): Partial<ProduceForkParametersFull> &
    Required<Pick<ProduceForkParametersFull, 'independent' | 'payloadType' | 'payloadVersion'>> => {
    const searchParams = new URLSearchParams(window.location.search);
    const app = searchParams.get('app') || '';
    const state = searchParams.get('state') || '';
    const localID = searchParams.get('u') || '';
    const forkType = searchParams.get('t') || '';
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

    return {
        state: state.slice(0, 100),
        localID: getValidatedLocalID(localID),
        app: getValidatedApp(app),
        forkType: getValidatedForkType(forkType),
        plan,
        independent: independent === '1' || independent === 'true',
        payloadType,
        payloadVersion,
    };
};

interface ProduceForkArguments {
    api: Api;
    UID: string;
    keyPassword?: string;
    app: APP_NAMES;
    state: string;
    persistent: boolean;
    trusted: boolean;
    independent: boolean;
    forkType?: ProduceForkParameters['forkType'];
    payloadType: ProduceForkParameters['payloadType'];
    payloadVersion: ProduceForkParameters['payloadVersion'];
}

export const produceFork = async ({
    api,
    UID,
    keyPassword,
    state,
    app,
    forkType,
    persistent,
    trusted,
    independent,
    payloadType,
    payloadVersion,
}: ProduceForkArguments) => {
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    const base64StringKey = encodeBase64URL(uint8ArrayToString(rawKey));
    const encryptedPayload = await (async () => {
        const forkData = (() => {
            if (payloadType === 'default' || payloadType === 'offline') {
                return { type: 'default', keyPassword: keyPassword || '' } as const;
            }
            throw new Error('Unsupported fork payload type');
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

    if (Payload) {
        try {
            const data = await getForkDecryptedBlob(await getKey(key), Payload, payloadVersion);
            keyPassword = data?.keyPassword || '';
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

    const { clientKey } = await persistSession({
        api: authApi,
        ...result,
        mode,
    });
    await authApi(setCookies({ UID, RefreshToken, State: getRandomString(24), Persistent: persistent }));

    return {
        ...result,
        path,
        clientKey,
    } as const;
};
