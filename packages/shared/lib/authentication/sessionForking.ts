import getRandomValues from 'get-random-values';
import { APP_NAMES, APPS, APPS_CONFIGURATION, SSO_PATHS } from '../constants';
import { encodeBase64URL, uint8ArrayToString } from '../helpers/encoding';
import { replaceUrl } from '../helpers/browser';
import { getAppHref } from '../apps/helper';
import {
    getValidatedApp,
    getValidatedForkType,
    getValidatedLocalID,
    getValidatedRawKey,
} from './sessionForkValidation';
import { getForkDecryptedBlob, getForkEncryptedBlob } from './sessionForkBlob';
import { InvalidForkConsumeError, InvalidPersistentSessionError } from './error';
import { PullForkResponse, PushForkResponse, RefreshSessionResponse } from './interface';
import { pullForkSession, pushForkSession, setRefreshCookies } from '../api/auth';
import { Api, User as tsUser } from '../interfaces';
import { withAuthHeaders, withUIDHeaders } from '../fetch/headers';
import { FORK_TYPE } from './ForkInterface';
import { persistSession, resumeSession } from './persistedSessionHelper';
import { getUser } from '../api/user';
import { getKey } from './cryptoHelper';

interface ForkState {
    url: string;
}
export const requestFork = (fromApp: APP_NAMES, localID?: number, type?: FORK_TYPE) => {
    const state = encodeBase64URL(uint8ArrayToString(getRandomValues(new Uint8Array(32))));

    const searchParams = new URLSearchParams();
    searchParams.append('app', fromApp);
    searchParams.append('state', state);
    if (localID !== undefined) {
        searchParams.append('u', `${localID}`);
    }
    if (type !== undefined) {
        searchParams.append('t', type);
    }

    const url = type === FORK_TYPE.SWITCH ? getAppHref('/', fromApp) : window.location.href;
    const forkStateData: ForkState = { url };
    sessionStorage.setItem(`f${state}`, JSON.stringify(forkStateData));

    return replaceUrl(getAppHref(`${SSO_PATHS.AUTHORIZE}?${searchParams.toString()}`, APPS.PROTONACCOUNT));
};

export interface ProduceForkParameters {
    state: string;
    app: APP_NAMES;
    type?: FORK_TYPE;
}
export interface ProduceForkParametersFull extends ProduceForkParameters {
    localID: number;
}
export const getProduceForkParameters = (): Partial<ProduceForkParametersFull> => {
    const searchParams = new URLSearchParams(window.location.search);
    const app = searchParams.get('app') || '';
    const state = searchParams.get('state') || '';
    const localID = searchParams.get('u') || '';
    const type = searchParams.get('t') || '';

    return {
        state: state.slice(0, 100),
        localID: getValidatedLocalID(localID),
        app: getValidatedApp(app),
        type: getValidatedForkType(type),
    };
};

interface ProduceForkArguments {
    api: Api;
    UID: string;
    keyPassword?: string;
    app: APP_NAMES;
    state: string;
    type?: FORK_TYPE;
}
export const produceFork = async ({ api, UID, keyPassword, state, app, type }: ProduceForkArguments) => {
    const rawKey = getRandomValues(new Uint8Array(32));
    const base64StringKey = encodeBase64URL(uint8ArrayToString(rawKey));
    const payload = keyPassword ? await getForkEncryptedBlob(await getKey(rawKey), { keyPassword }) : undefined;
    const childClientID = APPS_CONFIGURATION[app].clientID;
    const { Selector } = await api<PushForkResponse>(
        withUIDHeaders(
            UID,
            pushForkSession({
                Payload: payload,
                ChildClientID: childClientID,
                Independent: 0,
            })
        )
    );

    const toConsumeParams = new URLSearchParams();
    toConsumeParams.append('selector', Selector);
    toConsumeParams.append('state', state);
    toConsumeParams.append('sk', base64StringKey);
    if (type !== undefined) {
        toConsumeParams.append('t', type);
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
    } catch (e) {
        return undefined;
    }
};

export const getConsumeForkParameters = () => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const selector = hashParams.get('selector') || '';
    const state = hashParams.get('state') || '';
    const base64StringKey = hashParams.get('sk') || '';
    const type = hashParams.get('t') || '';

    return {
        state: state.slice(0, 100),
        selector,
        key: base64StringKey.length ? getValidatedRawKey(base64StringKey) : undefined,
        type: getValidatedForkType(type),
    };
};

interface ConsumeForkArguments {
    api: Api;
    selector: string;
    state: string;
    key: Uint8Array;
    type?: FORK_TYPE;
}
export const consumeFork = async ({ selector, api, state, key, type }: ConsumeForkArguments) => {
    const stateData = getForkStateData(sessionStorage.getItem(`f${state}`));
    if (!stateData) {
        throw new InvalidForkConsumeError(`Missing state ${state}`);
    }
    const { url } = stateData;
    if (!url) {
        throw new InvalidForkConsumeError('Missing url');
    }
    const { pathname, search, hash } = new URL(url);
    const path = `${pathname}${search}${hash}`;

    const { UID, RefreshToken, Payload, LocalID } = await api<PullForkResponse>(pullForkSession(selector));

    const flow = type === FORK_TYPE.SIGNUP ? 'signup' : undefined;

    try {
        // Resume and use old session if it exists
        const validatedSession = await resumeSession(api, LocalID);
        return {
            ...validatedSession,
            path,
            flow,
        } as const;
    } catch (e) {
        // If existing session is invalid. Fall through to continue using the new fork.
        if (!(e instanceof InvalidPersistentSessionError)) {
            throw e;
        }
    }

    let keyPassword: string | undefined;

    if (Payload) {
        try {
            const data = await getForkDecryptedBlob(await getKey(key), Payload);
            keyPassword = data?.keyPassword;
        } catch (e) {
            throw new InvalidForkConsumeError('Failed to decrypt payload');
        }
    }

    const { AccessToken: newAccessToken, RefreshToken: newRefreshToken } = await api<RefreshSessionResponse>(
        withUIDHeaders(UID, setRefreshCookies({ RefreshToken }))
    );

    const User = await api<{ User: tsUser }>(withAuthHeaders(UID, newAccessToken, getUser())).then(({ User }) => User);

    const result = {
        User,
        UID,
        LocalID,
        keyPassword,
        AccessToken: newAccessToken,
        RefreshToken: newRefreshToken,
    };

    await persistSession({ api, ...result });

    return {
        ...result,
        path,
        flow,
    } as const;
};
