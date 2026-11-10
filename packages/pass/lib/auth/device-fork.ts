import { getQrCodePayload, serializeQrCodePayload } from '@proton/account/signInWithAnotherDevice/qrCodePayload';
import { getForks, pullForkSession } from '@proton/shared/lib/api/auth';
import { getApiError, getIsOfflineError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { ForkSearchParameters } from '@proton/shared/lib/authentication/fork/constants';
import type { PullForkResponse } from '@proton/shared/lib/authentication/interface';
import { HTTP_STATUS_CODE, MINUTE, SECOND, SSO_PATHS } from '@proton/shared/lib/constants';

import type { Api } from '../../types/api/api';
import type { ConsumeForkOptions } from './fork';

const DEVICE_FORK_REDIRECT_URL = 'protonpass://login';
const DEVICE_FORK_PAYLOAD_VERSION = 3;
/** Account's `RememberMode.Hidden`: desktop sessions are always persistent */
const DEVICE_FORK_HIDE_REMEMBER_CHECKBOX = 2;
export const DEVICE_FORK_POLL_INTERVAL = 3 * SECOND;
export const DEVICE_FORK_LIFETIME = 9 * MINUTE;
export const DEVICE_FORK_TOTAL_LIFETIME = 3 * DEVICE_FORK_LIFETIME;

export class DeviceForkExpiredError extends Error {}

export type DeviceFork = {
    selector: string;
    key: Uint8Array<ArrayBuffer>;
    url: string;
};

export type PulledDeviceFork = DeviceFork & { response: PullForkResponse };

type DeviceForkOptions = {
    api: Api;
    /** Client ID of the running app (`getClientID(APP_NAME)`) */
    clientID: string;
    /** Account origin (`config.SSO_URL`): derived from `window.location`, it would be `file://` in Electron */
    host: string;
    signal?: AbortSignal;
};

const wait = (ms: number, signal?: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
        signal?.throwIfAborted();
        const waitEnded = new AbortController();

        const timeout = setTimeout(() => {
            waitEnded.abort();
            resolve();
        }, ms);

        signal?.addEventListener(
            'abort',
            () => {
                clearTimeout(timeout);
                reject(signal.reason);
            },
            { once: true, signal: waitEnded.signal }
        );
    });

const isPendingError = (err: unknown) =>
    getIsOfflineError(err) || getApiError(err).status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY;

/** Asks account to sign in the device through `/desktop/login`: the user
 * validates in any browser, the app only waits for the fork to be ready. */
export const requestDeviceFork = async ({ api, clientID, host, signal }: DeviceForkOptions): Promise<DeviceFork> => {
    const { Selector, UserCode } = await api<{ Selector: string; UserCode: string }>({
        ...getForks(),
        signal,
        silence: true,
        unauthenticated: true,
    });

    const key = crypto.getRandomValues(new Uint8Array(32));
    const payload = serializeQrCodePayload(
        getQrCodePayload({ userCode: UserCode, encodedBytes: key.toBase64(), childClientId: clientID })
    );

    const searchParams = new URLSearchParams({
        [ForkSearchParameters.App]: 'pass',
        [ForkSearchParameters.PayloadType]: 'offline',
        [ForkSearchParameters.PayloadVersion]: `${DEVICE_FORK_PAYLOAD_VERSION}`,
        redirectUrl: DEVICE_FORK_REDIRECT_URL,
        remember: `${DEVICE_FORK_HIDE_REMEMBER_CHECKBOX}`,
    });

    const url = `${host}${SSO_PATHS.DESKTOP_SIGN_IN}?${searchParams}#${new URLSearchParams({ payload })}`;

    return { selector: Selector, key, url };
};

const pullUntilExpired = async ({ api, selector, signal }: { api: Api; selector: string; signal?: AbortSignal }) => {
    const startedAt = Date.now();

    while (Date.now() - startedAt < DEVICE_FORK_LIFETIME) {
        try {
            return await api<PullForkResponse>({
                ...pullForkSession(selector),
                signal,
                silence: true,
                unauthenticated: true,
            });
        } catch (err) {
            if (!isPendingError(err)) throw err;
        }

        await wait(DEVICE_FORK_POLL_INTERVAL, signal);
    }

    return null;
};

/** The fork is already pulled by `pollDeviceFork`: a pulled fork can't be pulled twice. */
export const getDeviceForkConsumeOptions = (
    fork: PulledDeviceFork
): Pick<ConsumeForkOptions, 'payload' | 'pullFork'> => ({
    pullFork: async () => fork.response,
    payload: {
        mode: 'web',
        forkSecret: null,
        key: fork.key,
        localState: '',
        payloadVersion: DEVICE_FORK_PAYLOAD_VERSION,
        persistent: true,
        selector: fork.selector,
        state: fork.selector,
    },
});

/** Requests a fork and polls it until the user signs in. Requests a new fork
 * (`onFork` is called again) when the current one expires, and throws
 * `DeviceForkExpiredError` after `DEVICE_FORK_TOTAL_LIFETIME`. */
export const pollDeviceFork = async ({
    onFork,
    ...options
}: DeviceForkOptions & { onFork: (fork: DeviceFork) => void }): Promise<PulledDeviceFork> => {
    const startedAt = Date.now();

    while (Date.now() - startedAt < DEVICE_FORK_TOTAL_LIFETIME) {
        const fork = await requestDeviceFork(options);
        onFork(fork);

        const response = await pullUntilExpired({ api: options.api, selector: fork.selector, signal: options.signal });
        if (response) return { ...fork, response };
    }

    throw new DeviceForkExpiredError();
};
