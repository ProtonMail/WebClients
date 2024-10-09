import { importKey } from '@proton/crypto/lib/subtle/aesGcm';

import { pushForkSession } from '../../api/auth';
import { getAppHref, getClientID } from '../../apps/helper';
import type { PushForkResponse } from '../../authentication/interface';
import type { OfflineKey } from '../../authentication/offlineKey';
import type { APP_NAMES } from '../../constants';
import { SSO_PATHS } from '../../constants';
import { withUIDHeaders } from '../../fetch/headers';
import { replaceUrl } from '../../helpers/browser';
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

    replaceUrl(getAppHref(`${SSO_PATHS.FORK}${search}${fragment}`, app));
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
    payloadType: 'offline' | 'default';
    payloadVersion: 1 | 2;
    email?: string;
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
    const forkVersion = Number(searchParams.get(ForkSearchParameters.Version) || '1');
    const independent = searchParams.get(ForkSearchParameters.Independent) || '0';
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
    const email = getEmailSessionForkSearchParameter(searchParams);

    return {
        state: state.slice(0, 100),
        localID,
        app: getValidatedApp(app),
        forkType: getValidatedForkType(forkType),
        prompt: prompt === 'login' ? 'login' : undefined,
        promptType,
        plan,
        independent: independent === '1' || independent === 'true',
        payloadType,
        payloadVersion,
        email,
        forkVersion,
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
