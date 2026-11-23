import { type ActorRefFrom, type Subscription, waitFor } from 'xstate';

import noop from '@proton/utils/noop';

import type { SignupEvent, signupStateMachine } from './signupStateMachine';

/**
 * The signup's operations as promises, for the flows to await: each sends its event to the signup machine, resolves
 * once the operation is over and rejects with the error it failed with. An operation the signup can't take at this
 * point resolves without having run.
 */
export const createSignupOperations = (actor: ActorRefFrom<typeof signupStateMachine>) => {
    // A form submitted while the signup loads waits for it
    const initialized = () => waitFor(actor, (snapshot) => !snapshot.matches('initializing'));

    // Operations run one at a time: the machine takes the next one once the previous is over
    let previous: Promise<unknown> = Promise.resolve();

    const run = (event: SignupEvent) => {
        const operation = previous.then(async () => {
            await initialized();
            // Never settles once the page closes the signup, or once it leaves for the app
            await new Promise<void>((resolve, reject) => {
                let subscriptions: Subscription[] = [];
                const settle = (callback: () => void) => {
                    subscriptions.forEach((subscription) => subscription.unsubscribe());
                    callback();
                };
                subscriptions = [
                    actor.on('operation.done', () => settle(resolve)),
                    actor.on('operation.failed', ({ error }) => settle(() => reject(error))),
                ];
                actor.send(event);
                // The signup took the event without starting an operation, e.g. one it can't take at this point
                if (!actor.getSnapshot().hasTag('busy')) {
                    settle(resolve);
                }
            });
        });
        previous = operation.catch(noop);
        return operation;
    };

    return {
        createUser: () => run({ type: 'user.create' }),
        setupUser: (options?: { reservation?: boolean }) => run({ type: 'user.setup', ...options }),
        setupSubscription: () => run({ type: 'subscription.setup' }),
        setOrgName: (orgName: string) => run({ type: 'orgName.set', orgName }),
        setDisplayName: (displayName: string) => run({ type: 'displayName.set', displayName }),
        setPassword: (password: string) => run({ type: 'password.set', password }),
        sendRecoveryPhrasePayload: () => run({ type: 'recoveryPhrase.send' }),
        login: () => run({ type: 'login' }),
    };
};
