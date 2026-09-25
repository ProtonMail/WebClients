import { type AnyActorLogic, createActor, waitFor } from 'xstate';

import { unprovidedAction, unprovidedActors } from './machineHelpers';

describe('unprovidedActors', () => {
    it('fails an actor the app did not provide, naming it', async () => {
        const { loadAccount } = unprovidedActors<{ loadAccount: AnyActorLogic }>({ loadAccount: true });
        const actor = createActor(loadAccount).start();
        await expect(waitFor(actor, () => false)).rejects.toThrow("The sign-in's loadAccount actor is not provided");
    });
});

describe('unprovidedAction', () => {
    it('throws, naming the action', () => {
        expect(() => unprovidedAction('restartSignIn')).toThrow("The sign-in's restartSignIn action is not provided");
    });
});
