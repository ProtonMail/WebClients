import { serverTime } from '@proton/crypto';
import { importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { getIsGlobalSSOAccount } from '@proton/shared/lib/keys';

import { pushForkSession } from '../../api/auth';
import { getAppHref, getClientID } from '../../apps/helper';
import type { PushForkResponse } from '../../authentication/interface';
import type { OfflineKey } from '../../authentication/offlineKey';
import type { APP_NAMES } from '../../constants';
import { SSO_PATHS } from '../../constants';
import { withUIDHeaders } from '../../fetch/headers';
import { encodeBase64URL, uint8ArrayToString } from '../../helpers/encoding';
import type { Api, User } from '../../interfaces';
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
    app: APP_NAMES;
    encryptedPayload: { payloadVersion: 1 | 2; payloadType: 'offline' | 'default' };
}

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
    forkParameters: { state, app, independent, forkType, forkVersion, payloadType, payloadVersion },
}: ProduceForkArguments): Promise<ProduceForkPayload> => {
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
        persistent,
        trusted,
        forkType,
        forkVersion,
        app,
        encryptedPayload,
    };
};

export const produceForkConsumption = (
    { selector, state, key, persistent, trusted, forkType, forkVersion, encryptedPayload, app }: ProduceForkPayload,
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

    const searchParamsString = searchParameters?.toString() || '';
    const search = searchParamsString ? `?${searchParamsString}` : '';
    const fragment = `#${fragmentSearchParams.toString()}`;

    return getAppHref(`${SSO_PATHS.FORK}${search}${fragment}`, app);
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
    };
};

export const getRequiredForkParameters = (
    forkParameters: ReturnType<typeof getProduceForkParameters>
): forkParameters is ProduceForkParametersFull => {
    return Boolean(forkParameters.app && forkParameters.state);
};

const getCanUserReAuth = (user: User) => {
    // The reauth container doesn't support an admin signed into a sub-user
    if (user.OrganizationPrivateKey) {
        return false;
    }
    return true;
};

const BYPASS_SESSION_MIN_AGE = 30_000; // 30 seconds
export const getShouldReAuth = (
    forkParameters: Pick<ProduceForkParameters, 'prompt' | 'promptType' | 'promptBypass'> | undefined,
    authSession: {
        User: User;
        offlineKey: OfflineKey | undefined;
        prompt?: 'login' | null;
        persistedAt: number;
    }
) => {
    const shouldReauth = forkParameters?.prompt === 'login' || authSession.prompt === 'login';
    if (!shouldReauth) {
        return false;
    }
    if (!getCanUserReAuth(authSession.User)) {
        return false;
    }
    if (forkParameters?.promptType === 'offline-bypass' && authSession.offlineKey) {
        /** `offline-bypass` is valid only if session was just persisted (<30seconds).
         * This avoids triggering re-auth during a sign-up flow to pass. In any other
         * scenario, we should avoid processing the by-pass and ask for password. */
        return +serverTime() - authSession.persistedAt > BYPASS_SESSION_MIN_AGE;
    }
    if (forkParameters?.promptBypass === 'sso' && getIsGlobalSSOAccount(authSession.User)) {
        return false;
    }
    return true;
};
