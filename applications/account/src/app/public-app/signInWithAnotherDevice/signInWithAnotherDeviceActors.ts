import { type EventObject, fromCallback, fromPromise } from 'xstate';

import { signInWithAnotherDevicePull } from '@proton/account/signInWithAnotherDevice/signInWithAnotherDevicePull';
import metrics from '@proton/metrics/metricsInstance';
import observeApiError from '@proton/metrics/observeApiError';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { type APP_NAMES, SECOND } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';
import noop from '@proton/utils/noop';

import type { AuthSession } from '../authSession';
import type { PullEvent } from './signInWithAnotherDeviceStateMachine';

export interface SignInWithAnotherDeviceServices {
    /** A silent API. */
    api: Api;
    appName: APP_NAMES;
    getKtActivation: () => Promise<KeyTransparencyActivation>;
    /** Starts the unauthenticated session the fork is created in. */
    startAuthSession: () => Promise<void>;
    login: (session: AuthSession) => Promise<unknown>;
}

export const createSignInWithAnotherDeviceActors = (services: SignInWithAnotherDeviceServices) => ({
    /** Creates the fork and its QR code, and polls until the other device produces it; stopping aborts the poll. */
    pull: fromCallback<EventObject>(({ sendBack }) => {
        const send = (event: PullEvent) => sendBack(event);
        const abortController = new AbortController();

        const run = async () => {
            await services.startAuthSession().catch(noop);
            const start = signInWithAnotherDevicePull({
                abortController,
                config: {
                    appName: services.appName,
                    persistent: true,
                    ktActivation: await services.getKtActivation(),
                },
                api: services.api,
                onResult: (data) => {
                    if (data.type === 'init') {
                        send({ type: 'pull.qrCodeCreated', qrCode: data.payload.qrCode });
                    }
                    if (data.type === 'error') {
                        const error = data.payload.error;
                        observeApiError(error, (status) => metrics.core_edm_pull_total.increment({ status }));
                        send({ type: 'pull.failed', error });
                    }
                    if (data.type === 'session') {
                        send({
                            type: 'pull.signedIn',
                            session: data.payload.session,
                            forkDurationTime: data.payload.forkDurationTime,
                        });
                    }
                },
            });
            return start();
        };

        run().catch(noop);
        return () => abortController.abort();
    }),
    signIn: fromPromise<void, { session: ResumedSessionResult; forkDurationTime: number }>(async ({ input }) => {
        metrics.core_edm_pull_total.increment({ status: 'success' });
        metrics.core_edm_pull_histogram.observe({ Value: Math.round(input.forkDurationTime / SECOND), Labels: {} });
        await metrics.processAllRequests().catch(noop);
        await services.login({ data: input.session, flow: 'sign-in-with-another-device' });
    }),
});

export type SignInWithAnotherDeviceActors = ReturnType<typeof createSignInWithAnotherDeviceActors>;
