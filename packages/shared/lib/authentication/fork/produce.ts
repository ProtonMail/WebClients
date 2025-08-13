import { serverTime } from '@proton/crypto';
import { importKey } from '@proton/crypto/lib/subtle/aesGcm';
import type { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { type ReturnUrlResult, getReturnUrl } from '@proton/shared/lib/authentication/returnUrl';
import { getRedirect } from '@proton/shared/lib/subscription/redirect';
import { isSelf } from '@proton/shared/lib/user/helpers';

import { pushForkSession } from '../../api/auth';
import { getAppHref, getClientID } from '../../apps/helper';
import type { APP_NAMES } from '../../constants';
import { SSO_PATHS } from '../../constants';
import { withUIDHeaders } from '../../fetch/headers';
import { encodeBase64URL, uint8ArrayToString } from '../../helpers/encoding';
import type { Api, User } from '../../interfaces';
import type { PushForkResponse } from '../interface';
import type { ResumedSessionResult } from '../persistedSessionHelper';
import { getForkEncryptedBlob } from './blob';
import type { ForkType } from './constants';
import { ForkSearchParameters } from './constants';
import {
    getEmailSessionForkSearchParameter,
    getLocalIDForkSearchParameter,
    getValidatedApp,
    getValidatedForkType,
} from './validation';

export interface ProduceForkPayload {
    selector: string;
    state: string;
    key: string;
    persistent: boolean;
    trusted: boolean;
    forkType: ForkType | undefined;
    forkVersion: number;
    source: SessionSource;
    app: APP_NAMES;
    encryptedPayload: { payloadVersion: 1 | 2; payloadType: 'offline' | 'default' };
}

interface ProduceForkArguments {
    api: Api;
    session: ResumedSessionResult;
    forkParameters: ProduceForkParameters;
}

export const produceFork = async ({
    api,
    session: { UID, keyPassword, offlineKey, persistedSession },
    forkParameters: { state, app, independent, forkType, forkVersion, payloadType, payloadVersion },
}: ProduceForkArguments): Promise<ProduceForkPayload> => {
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    const base64StringKey = encodeBase64URL(uint8ArrayToString(rawKey));
    const encryptedPayload = await (async () => {
        const forkData = (() => {
            if (payloadType === 'offline' && offlineKey && offlineKey.salt && offlineKey.password) {
                return {
                    type: 'offline',
                    keyPassword,
                    offlineKeyPassword: offlineKey.password,
                    offlineKeySalt: offlineKey.salt,
                } as const;
            }
            return { type: 'default', keyPassword } as const;
        })();
        return {
            blob: await getForkEncryptedBlob(await importKey(rawKey), forkData, payloadVersion),
            payloadType: forkData.type,
            payloadVersion,
        };
    })();

    const childClientID = getClientID(app);
    const { Selector: selector } = await api<PushForkResponse>(
        withUIDHeaders(
            UID,
            pushForkSession({
                Payload: encryptedPayload.blob,
                ChildClientID: childClientID,
                Independent: independent ? 1 : 0,
            })
        )
    );

    return {
        selector,
        state,
        key: base64StringKey,
        persistent: persistedSession.persistent,
        trusted: persistedSession.trusted,
        forkType,
        forkVersion,
        source: persistedSession.source,
        app,
        encryptedPayload,
    };
};

export const produceForkConsumption = (
    {
        selector,
        state,
        key,
        persistent,
        trusted,
        forkType,
        forkVersion,
        encryptedPayload,
        app,
        source,
    }: ProduceForkPayload,
    searchParameters?: URLSearchParams
) => {
    const fragmentSearchParams = new URLSearchParams();
    fragmentSearchParams.append(ForkSearchParameters.Selector, selector);
    fragmentSearchParams.append(ForkSearchParameters.State, state);
    fragmentSearchParams.append(ForkSearchParameters.Base64Key, key);
    fragmentSearchParams.append(ForkSearchParameters.Version, `${forkVersion}`);
    if (persistent) {
        fragmentSearchParams.append(ForkSearchParameters.Persistent, '1');
    }
    if (trusted) {
        fragmentSearchParams.append(ForkSearchParameters.Trusted, '1');
    }
    if (forkType !== undefined) {
        fragmentSearchParams.append(ForkSearchParameters.ForkType, forkType);
    }
    if (encryptedPayload.payloadVersion !== undefined) {
        fragmentSearchParams.append(ForkSearchParameters.PayloadVersion, `${encryptedPayload.payloadVersion}`);
    }
    if (encryptedPayload.payloadType !== undefined) {
        fragmentSearchParams.append(ForkSearchParameters.PayloadType, `${encryptedPayload.payloadType}`);
    }
    if (source !== undefined) {
        fragmentSearchParams.append(ForkSearchParameters.Source, `${source}`);
    }

    const searchParamsString = searchParameters?.toString() || '';
    const search = searchParamsString ? `?${searchParamsString}` : '';
    const fragment = `#${fragmentSearchParams.toString()}`;

    return getAppHref(`${SSO_PATHS.FORK}${search}${fragment}`, app);
};

const getWhitelistedProtocol = (app: APP_NAMES, redirectUrl: string) => {
    const protocol = redirectUrl.match(/^([^:]+:)\/\//)?.[1];
    if (!protocol) {
        return;
    }
    if (getRedirect(`${protocol}//`)) {
        return protocol;
    }
    // Special case for internal apps
    if (`${app}:` === protocol) {
        return protocol;
    }
};

export const getProduceForkUrl = (
    payload: ProduceForkPayload,
    produceForkParameters: ProduceForkParametersFull,
    searchParameters?: URLSearchParams
) => {
    const url = new URL(produceForkConsumption(payload, searchParameters));

    const redirectUrl = produceForkParameters.redirectUrl;
    if (redirectUrl) {
        const protocol = getWhitelistedProtocol(produceForkParameters.app, redirectUrl);
        if (protocol) {
            return new URL(`${protocol}//${url.pathname.slice(1)}${url.search}${url.hash}`);
        }
    }

    const returnUrl = produceForkParameters.returnUrl;
    if (returnUrl && returnUrl.target === 'app') {
        url.pathname = returnUrl.location.pathname;
        const returnUrlSearchParams = new URLSearchParams(returnUrl.location.search);
        returnUrlSearchParams.forEach((value, key) => {
            url.searchParams.append(key, value);
        });
    }

    return url;
};

export interface ProduceForkParameters {
    state: string;
    app: APP_NAMES;
    plan?: string;
    independent: boolean;
    forkType?: ForkType;
    forkVersion: number;
    prompt: 'login' | undefined;
    promptType: 'offline-bypass' | 'offline' | 'default';
    promptBypass: 'none' | 'sso';
    payloadType: 'offline' | 'default';
    payloadVersion: 1 | 2;
    unauthenticatedReturnUrl: string;
    returnUrl: ReturnUrlResult | undefined;
    redirectUrl: string;
    email?: string;
    partnerId?: string;
}

export interface ProduceForkParametersFull extends ProduceForkParameters {
    localID: number;
}

export const getProduceForkParameters = (
    searchParams: URLSearchParams
): Omit<ProduceForkParametersFull, 'localID' | 'app'> & Partial<Pick<ProduceForkParametersFull, 'localID' | 'app'>> => {
    const app = searchParams.get(ForkSearchParameters.App) || '';
    const state = searchParams.get(ForkSearchParameters.State) || '';
    const localID = getLocalIDForkSearchParameter(searchParams);
    const forkType = searchParams.get(ForkSearchParameters.ForkType) || '';
    const prompt = searchParams.get(ForkSearchParameters.Prompt) || '';
    const plan = searchParams.get(ForkSearchParameters.Plan) || '';
    const partnerId = searchParams.get(ForkSearchParameters.PartnerId) || '';
    const forkVersion = Number(searchParams.get(ForkSearchParameters.Version) || '1');
    const independent = searchParams.get(ForkSearchParameters.Independent) || '0';
    const unauthenticatedReturnUrl = (() => {
        const value = searchParams.get(ForkSearchParameters.UnauthenticatedReturnUrl) || '';
        if (value) {
            try {
                const decodedValue = decodeURIComponent(value);
                if (decodedValue.startsWith('/')) {
                    return decodedValue;
                }
            } catch {}
        }
        return '';
    })();
    const returnUrl = getReturnUrl(searchParams);
    const redirectUrl = searchParams.get('redirectUrl') || '';
    const payloadType = (() => {
        const value = searchParams.get(ForkSearchParameters.PayloadType) || '';
        if (value === 'offline') {
            return value;
        }
        return 'default';
    })();
    const payloadVersion = (() => {
        const value = Number(searchParams.get(ForkSearchParameters.PayloadVersion) || '1');
        if (value === 1 || value === 2) {
            return value;
        }
        return 1;
    })();
    const promptType = (() => {
        const value = searchParams.get(ForkSearchParameters.PromptType) || '';
        if (value === 'offline' || value === 'offline-bypass') {
            return value;
        }
        return 'default';
    })();
    const promptBypass = (() => {
        const value = searchParams.get(ForkSearchParameters.PromptBypass) || '';
        if (value === 'none' || value === 'sso') {
            return value;
        }
        // By default, re-auth prompts are disabled for SSO users due to bad UX.
        // But it's still allowed in some flows, like exporting passwords.
        return 'sso';
    })();
    const email = getEmailSessionForkSearchParameter(searchParams);

    return {
        state: state.slice(0, 100),
        localID,
        app: getValidatedApp(app),
        forkType: getValidatedForkType(forkType),
        prompt: prompt === 'login' ? 'login' : undefined,
        promptType,
        promptBypass,
        plan,
        independent: independent === '1' || independent === 'true',
        payloadType,
        payloadVersion,
        email,
        forkVersion,
        partnerId,
        unauthenticatedReturnUrl,
        returnUrl,
        redirectUrl,
    };
};

export const getRequiredForkParameters = (
    forkParameters: ReturnType<typeof getProduceForkParameters>
): forkParameters is ProduceForkParametersFull => {
    return Boolean(forkParameters.app && forkParameters.state);
};

const getCanUserReAuth = (user: User) => {
    // The reauth container doesn't support non-self
    return isSelf(user);
};

const BYPASS_SESSION_MIN_AGE = 30_000; // 30 seconds
export const getShouldReAuth = (
    forkParameters: Pick<ProduceForkParameters, 'prompt' | 'promptType' | 'promptBypass'> | undefined,
    authSession: {
        data: ResumedSessionResult;
        prompt?: 'login' | null;
    }
) => {
    const shouldReauth = forkParameters?.prompt === 'login' || authSession.prompt === 'login';
    if (!shouldReauth) {
        return false;
    }
    if (!getCanUserReAuth(authSession.data.User)) {
        return false;
    }
    if (forkParameters?.promptType === 'offline-bypass' && authSession.data.offlineKey) {
        /** `offline-bypass` is valid only if session was just persisted (<30seconds).
         * This avoids triggering re-auth during a sign-up flow to pass. In any other
         * scenario, we should avoid processing the by-pass and ask for password. */
        return +serverTime() - authSession.data.persistedSession.persistedAt > BYPASS_SESSION_MIN_AGE;
    }
    return true;
};
