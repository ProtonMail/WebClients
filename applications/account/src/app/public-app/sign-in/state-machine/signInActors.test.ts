import { type EventObject, createActor, setup } from 'xstate';

import { type SignInActorServices, createSignInActors } from './signInActors';

describe('createSignInActors', () => {
    it('tells the machine when the unauthenticated session expires, until it stops', () => {
        const unsubscribe = jest.fn();
        let expire = () => {};
        const services = {
            onSessionExpired: (listener: () => void) => {
                expire = listener;
                return unsubscribe;
            },
        } as unknown as SignInActorServices;
        const received: EventObject[] = [];
        const parent = setup({ actors: { watchSession: createSignInActors(services).watchSession } }).createMachine({
            invoke: { src: 'watchSession' },
            on: { 'session.expired': { actions: ({ event }) => received.push(event) } },
        });
        const actor = createActor(parent).start();

        expire();
        expect(received).toEqual([{ type: 'session.expired' }]);
        actor.stop();
        expect(unsubscribe).toHaveBeenCalled();
    });
});
