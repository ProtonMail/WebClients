import { type ActorRefFrom, waitFor } from 'xstate';

import noop from '@proton/utils/noop';

import type { SignupEvent, signupStateMachine } from './signupStateMachine';

/**
 * The signup's operations as promises, for the flows to await: each sends its event to the signup machine, resolves
 * once the operation is over and rejects with the error it failed with. An operation the signup can't take at this
 * point resolves without having run.
 */
export const createSignupOperations = (actor: ActorRefFrom<typeof signupStateMachine>) => {
    // Never settles once the page closes the signup: useActorRef mutes the observers before stopping the actor
    const settled = () => waitFor(actor, (snapshot) => !snapshot.hasTag('busy'));

    // Operations run one at a time: the machine takes the next one once the previous is over
    let previous: Promise<unknown> = Promise.resolve();

    const run = (event: SignupEvent) => {
        const operation = previous.then(async () => {
            const previousFailure = actor.getSnapshot().context.failure;
            actor.send(event);
            const { failure } = (await settled()).context;
            if (failure && failure !== previousFailure) {
                throw failure.error;
            }
        });
        previous = operation.catch(noop);
        return operation;
    };

    return {
        createUser: () => run({ type: 'user.create' }),
        setupUser: () => run({ type: 'user.setup' }),
        setupSubscription: () => run({ type: 'subscription.setup' }),
        setOrgName: (orgName: string) => run({ type: 'orgName.set', orgName }),
        setDisplayName: (displayName: string) => run({ type: 'displayName.set', displayName }),
        sendRecoveryPhrasePayload: () => run({ type: 'recoveryPhrase.send' }),
        login: () => run({ type: 'login' }),
    };
};
