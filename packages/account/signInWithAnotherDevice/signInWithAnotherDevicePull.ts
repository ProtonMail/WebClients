import {
    type QRCodePayload,
    deserializeQrCodePayload,
    getQrCodePayload,
    serializeQrCodePayload,
} from '@proton/account/signInWithAnotherDevice/qrCodePayload';
import { createPreAuthKTVerifier } from '@proton/key-transparency/shared';
import { getForks, pullForkSession, revoke } from '@proton/shared/lib/api/auth';
import { getApiError, getIsOfflineError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAuthAPI } from '@proton/shared/lib/api/helpers/customConfig';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { persistForkedSession, resolveForkPasswords } from '@proton/shared/lib/authentication/fork';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { PullForkResponse } from '@proton/shared/lib/authentication/interface';
import {
    type ResumedSessionResult,
    maybeResumeSessionByUser,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { type APP_NAMES, HTTP_STATUS_CODE, MINUTE, SECOND } from '@proton/shared/lib/constants';
import { omit } from '@proton/shared/lib/helpers/object';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';
import type { Api, KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';
import { deviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecoveryHelper';
import noop from '@proton/utils/noop';

const forkExpirationTime = 9 * MINUTE; // The time it takes until a new fork and QR code is regenerated
const totalExpirationTime = forkExpirationTime * 3; // The time it takes until the process errors out completely (to avoid spamming the API)

export class GiveUpError extends Error {
    public trace = false;
}

class RestartError extends Error {
    public trace = false;
}

class TryAgainError extends Error {
    public trace = false;
}

interface ForkConfig {
    appName: APP_NAMES;
    persistent: boolean;
    ktActivation: KeyTransparencyActivation;
}

interface ForkDataResult {
    qrCode: string;
    selector: string;
    date: number;
    // Anything in extra is data that isn't persisted (runtime only).
    extra: {
        qrCode: QRCodePayload;
        bytes: Uint8Array<ArrayBuffer>;
    };
}

// Retrieves persisted fork data from storage.
const getPersistedForkData = (): ForkDataResult | null => {
    const edmItem = getItem('edm');
    if (!edmItem) {
        return null;
    }
    try {
        const result: Omit<ForkDataResult, 'extra'> = JSON.parse(edmItem);
        const qrCode = result.qrCode;
        const qrCodePayload = deserializeQrCodePayload(qrCode);
        if (!qrCodePayload.encodedBytes) {
            throw new Error('Invalid code');
        }
        return {
            selector: result.selector,
            qrCode,
            date: result.date || Date.now(),
            extra: {
                bytes: Uint8Array.fromBase64(qrCodePayload.encodedBytes),
                qrCode: qrCodePayload,
            },
        };
    } catch {
        return null;
    }
};

const setPersistedForkData = (data: ForkDataResult) => {
    setItem('edm', JSON.stringify(omit(data, ['extra'])));
};

const removePersistedForkData = () => {
    removeItem('edm');
};

// Generates new fork data, generates a selector and accompanying QR code data.
const getNewForkData = async ({
    api,
    signal,
    config,
}: {
    api: Api;
    signal: AbortSignal;
    config: ForkConfig;
}): Promise<ForkDataResult> => {
    const { UserCode, Selector } = await api<{ Selector: string; UserCode: string }>({
        ...getForks(),
        signal,
        silence: true,
    });
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const qrCodePayload = getQrCodePayload({
        userCode: UserCode,
        encodedBytes: bytes.toBase64(),
        childClientId: getClientID(config.appName),
    });
    return {
        selector: Selector,
        qrCode: serializeQrCodePayload(qrCodePayload),
        date: Date.now(),
        extra: {
            bytes,
            qrCode: qrCodePayload,
        },
    };
};

// Gets the necessary fork data, either from storage or by generating anew.
const getForkData = async ({
    api,
    signal,
    config,
}: {
    api: Api;
    signal: AbortSignal;
    config: ForkConfig;
}): Promise<ForkDataResult> => {
    const persisted = getPersistedForkData();
    if (persisted) {
        return persisted;
    }
    const data = await getNewForkData({ api, signal, config });
    setPersistedForkData(data);
    return data;
};

// The fetch fork logic that determines when a fork is ready to be used, or when it should try again, or restart.
const fetchForkResponse = async ({
    api: unAuthApi,
    forkData,
    signal,
}: {
    api: Api;
    forkData: ForkDataResult;
    signal: AbortSignal;
}): Promise<PullForkResponse> => {
    try {
        return await unAuthApi<PullForkResponse>({
            ...pullForkSession(forkData.selector),
            signal,
            silence: true,
        });
    } catch (e: any) {
        if (Date.now() - forkData.date > forkExpirationTime) {
            throw new RestartError();
        }
        // Offline errors just try again. Eventually it'll get into RestartError which will show the error screen.
        if (getIsOfflineError(e)) {
            throw new TryAgainError();
        }
        const { status } = getApiError(e);
        if (status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY) {
            throw new TryAgainError();
        }
        throw e;
    }
};

// Once a fork has been generated, this function either resumes an already existing session, or persists and initiates a new session.
const consumeForkSession = async ({
    api: unAuthApi,
    forkData,
    config,
    pullForkResponse,
}: {
    api: Api;
    forkData: ForkDataResult;
    config: ForkConfig;
    signal: AbortSignal;
    pullForkResponse: PullForkResponse;
}): Promise<ResumedSessionResult> => {
    const authApi = getAuthAPI(pullForkResponse.UID, pullForkResponse.AccessToken, unAuthApi);
    let user = await getUser(authApi);

    const resumedSession = await maybeResumeSessionByUser({
        api: unAuthApi,
        User: user,
        // During proton login, ignore resuming an oauth session
        options: { source: [SessionSource.Saml, SessionSource.Proton] },
    });

    if (resumedSession) {
        await authApi(revoke({ Child: 1 })).catch(noop);
        return resumedSession;
    }

    const { keyPassword } = await resolveForkPasswords({
        key: forkData.extra.bytes,
        payloadVersion: 1,
        pullForkResponse,
    });

    if (!keyPassword) {
        throw new Error('Incorrect payload');
    }

    const decryptedKeys = await getDecryptedUserKeysHelper(user, keyPassword);
    if (!decryptedKeys.length) {
        throw new Error('Unable to decrypt keys');
    }

    const persistent = config.persistent;
    const preAuthKTVerifier = createPreAuthKTVerifier(config.ktActivation);

    const deviceRecoveryResult = await deviceRecovery({
        user,
        addresses: undefined,
        api: authApi,
        appName: config.appName,
        persistent,
        keyPassword,
        preAuthKTVerifier,
    });
    user = deviceRecoveryResult.user;
    const trusted = deviceRecoveryResult.trusted;

    const session = await persistForkedSession({
        api: authApi,
        user,
        pullForkResponse,
        payload: {
            persistent,
            trusted,
            keyPassword,
            forkedOfflineKey: undefined,
            // We'll leave it as Proton session. We assume we'll never get OAuth sessions.
            // If it gets missourced as Saml it's ok, since that information is extracted from user anyway.
            source: SessionSource.Proton,
        },
    });

    await preAuthKTVerifier.preAuthKTCommit(user.ID, authApi);

    return session;
};

const pollInterval = 3 * SECOND;

interface PollArguments {
    api: Api;
    forkData: ForkDataResult;
    signal: AbortSignal;
    config: ForkConfig;
    onSuccess: (data: { session: ResumedSessionResult; forkData: ForkDataResult }) => void;
    onError: (error: any) => void;
}

// The poll functionality which runs itself in setTimeout iterations.
const poll = ({ api, forkData, signal, config, onError, onSuccess }: PollArguments) => {
    let handle: ReturnType<typeof setTimeout>;

    const cancel = () => {
        clearTimeout(handle);
    };
    signal.addEventListener('abort', cancel);

    const run = async () => {
        try {
            const pullForkResponse = await fetchForkResponse({ api, forkData, signal });
            const session = await consumeForkSession({ api, forkData, signal, config, pullForkResponse });
            onSuccess({ session, forkData });
        } catch (e: any) {
            if (e instanceof TryAgainError) {
                handle = setTimeout(() => {
                    run().catch(noop);
                }, pollInterval);
                return;
            }
            signal.removeEventListener('abort', cancel);
            onError(e);
        }
    };

    run().catch(noop);
};

export type SignInWithAnotherDeviceResult =
    | { type: 'init'; payload: ForkDataResult }
    | { type: 'error'; payload: { error: any } }
    | {
          type: 'session';
          payload: {
              session: ResumedSessionResult;
              // The time it took from creating the fork until it got consumed
              forkDurationTime: number;
              // The time it took from initiating the process until it got completed (may include multiple forks)
              totalDurationTime: number;
          };
      };

// The main process that initiates a fork, qr code, and start the polling behavior.
export const signInWithAnotherDevicePull = ({
    abortController,
    api,
    config,
    onResult,
}: {
    abortController: AbortController;
    api: Api;
    config: ForkConfig;
    onResult: (data: SignInWithAnotherDeviceResult) => void;
}) => {
    const signal = abortController.signal;
    let start: undefined | (() => void);
    const initTime = Date.now();

    const handleSuccess: PollArguments['onSuccess'] = ({ session, forkData }) => {
        if (signal.aborted) {
            return;
        }
        removePersistedForkData();
        const totalDurationTime = Date.now() - initTime;
        const forkDurationTime = Date.now() - forkData.date;
        onResult({ type: 'session', payload: { session, forkDurationTime, totalDurationTime } });
    };

    const handleError: PollArguments['onError'] = (e) => {
        if (signal.aborted) {
            return;
        }
        removePersistedForkData();
        if (Date.now() - initTime > totalExpirationTime) {
            onResult({ type: 'error', payload: { error: new GiveUpError() } });
            return;
        }
        if (e instanceof RestartError) {
            start?.();
            return;
        }
        onResult({ type: 'error', payload: { error: e } });
    };

    const run = async () => {
        try {
            const forkData = await getForkData({ api, signal, config });

            if (signal.aborted) {
                return;
            }

            onResult({ type: 'init', payload: forkData });

            poll({
                api,
                forkData,
                config,
                signal,
                onSuccess: handleSuccess,
                onError: handleError,
            });
        } catch (e) {
            handleError(e);
        }
    };

    start = () => {
        run().catch(noop);
    };

    return start;
};
