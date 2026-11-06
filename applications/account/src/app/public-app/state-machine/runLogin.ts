import { type ActorRefFrom, waitFor } from 'xstate';

import type { AuthSession, OnLoginCallbackResult } from '../authSession';
import type { publicAppStateMachine } from './publicAppStateMachine';

let loginRequestCount = 0;

const completeResult: OnLoginCallbackResult = { state: 'complete' };
const inputResult: OnLoginCallbackResult = { state: 'input' };

/** Runs the login in the machine, for the screens that wait on a promise. */
export const runLogin = (actorRef: ActorRefFrom<typeof publicAppStateMachine>, session: AuthSession) =>
    new Promise<OnLoginCallbackResult>((resolve, reject) => {
        const requestId = String(++loginRequestCount);
        const subscriptions = [
            actorRef.on('login.completed', (event) => {
                if (event.requestId === requestId) {
                    subscriptions.forEach((subscription) => subscription.unsubscribe());
                    resolve(event.result.type === 'done' ? completeResult : inputResult);
                }
            }),
            actorRef.on('login.failed', (event) => {
                if (event.requestId === requestId) {
                    subscriptions.forEach((subscription) => subscription.unsubscribe());
                    reject(event.error);
                }
            }),
        ];
        actorRef.send({ type: 'login.requested', session, requestId });
        // The machine only takes a login when it isn't busy with another one
        if (actorRef.getSnapshot().context.loginRequestId !== requestId) {
            subscriptions.forEach((subscription) => subscription.unsubscribe());
            reject(new Error('Another sign in is in progress'));
        }
    });

/** Waits for the crypto worker, loading it if no page asked for it yet; rejects with its error if it failed to load. */
export const requireCrypto = async (actorRef: ActorRefFrom<typeof publicAppStateMachine>) => {
    actorRef.send({ type: 'crypto.requested' });
    const { context } = await waitFor(
        actorRef,
        (snapshot) => snapshot.context.crypto === 'ready' || snapshot.context.crypto === 'failed'
    );
    if (context.crypto === 'failed') {
        throw context.cryptoError;
    }
};
