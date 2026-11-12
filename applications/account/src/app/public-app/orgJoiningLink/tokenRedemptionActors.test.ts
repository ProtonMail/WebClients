import { type EventObject, createActor, setup } from 'xstate';

import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import { createTokenRedemptionActors } from './tokenRedemptionActors';

describe('createTokenRedemptionActors', () => {
    it('tells the machine when the unauthenticated session expires, until it stops', () => {
        const unsubscribe = jest.fn();
        let expire = () => {};
        const unauthenticatedApi = {
            onSessionExpired: (listener: () => void) => {
                expire = listener;
                return unsubscribe;
            },
        } as unknown as UnauthenticatedApi;
        const actors = createTokenRedemptionActors({
            unauthenticatedApi,
            onPreSubmit: () => Promise.resolve(),
            onStartAuth: () => Promise.resolve(),
            login: () => Promise.resolve(),
        });
        const received: EventObject[] = [];
        const parent = setup({ actors: { watchSession: actors.watchSession } }).createMachine({
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
