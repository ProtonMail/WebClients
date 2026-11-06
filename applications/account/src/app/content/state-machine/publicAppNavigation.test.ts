import { createMemoryHistory } from 'history';
import { createActor, fromCallback } from 'xstate';

import { SSO_PATHS } from '@proton/shared/lib/constants';

import { createPublicAppNavigation } from './publicAppNavigation';
import { publicAppStateMachine } from './publicAppStateMachine';

describe('createPublicAppNavigation', () => {
    // React renders a new machine state in a microtask it queues when the actor notifies its subscribers: the
    // navigation has to run before it, so the routes render the new state and the new location together
    it('navigates before the render the new state schedules', async () => {
        const history = createMemoryHistory();
        const order: string[] = [];
        const actor = createActor(
            publicAppStateMachine.provide({
                actors: { watchLanguage: fromCallback(() => {}) },
                actions: createPublicAppNavigation(history),
            }),
            {
                input: {
                    location: { pathname: SSO_PATHS.SIGNUP, search: '', hash: '', state: undefined, localePrefix: '' },
                    initialSessionsLength: 0,
                },
            }
        ).start();
        actor.subscribe(() => queueMicrotask(() => order.push('render')));
        history.listen((location) => order.push(location.pathname));

        actor.send({
            type: 'login.resulted',
            result: { type: 'sessions-switcher', location: SSO_PATHS.SWITCH, payload: null },
        });
        expect(order).toEqual([]);

        await Promise.resolve();
        expect(order).toEqual([SSO_PATHS.SWITCH, 'render']);
    });

    it('replaces a fork URL it leaves, so going back skips it', async () => {
        const history = createMemoryHistory({ initialEntries: ['/start', SSO_PATHS.AUTHORIZE] });
        const { followLoginResult } = createPublicAppNavigation(history);

        followLoginResult(undefined, {
            result: { type: 'sessions-switcher', location: SSO_PATHS.SWITCH, payload: null },
        });
        await Promise.resolve();
        history.goBack();

        expect(history.location.pathname).toBe('/start');
    });
});
