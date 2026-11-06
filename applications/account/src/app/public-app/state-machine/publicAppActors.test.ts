import { createMemoryHistory } from 'history';
import { type AnyEventObject, createActor, createMachine, toPromise } from 'xstate';

import { SSO_PATHS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

import { createPublicAppActors } from './publicAppActors';
import { InvalidForkError, publicAppStateMachine } from './publicAppStateMachine';

jest.mock('../localePrefix', () => ({
    stripLocaleTagPrefix: (pathname: string) => ({ localePrefix: pathname.match(/^\/(de|fr)\//)?.[1] ?? '' }),
    getLocaleMapping: (localeCode: string) => localeCode,
}));

describe('watchLanguage', () => {
    it('tells the machine when the user picks another language, until it stops', () => {
        const history = createMemoryHistory({ initialEntries: ['/de/login'] });
        const { watchLanguage } = createPublicAppActors({
            api: jest.fn() as unknown as Api,
            history,
            unleashClient: {} as UnleashClient,
        });
        const received: AnyEventObject[] = [];
        const parent = createActor(
            createMachine({
                invoke: { src: watchLanguage, input: 'de' },
                on: { '*': { actions: ({ event }) => received.push(event) } },
            })
        ).start();

        history.push('/de/signup');
        history.push('/fr/signup');
        history.push('/fr/login');
        expect(received).toEqual([{ type: 'language.changed', localePrefix: 'fr' }]);

        parent.stop();
        history.push('/login');
        expect(received).toHaveLength(1);
    });
});

describe('resolve', () => {
    const { resolve } = createPublicAppActors({
        api: jest.fn() as unknown as Api,
        history: createMemoryHistory(),
        unleashClient: {} as UnleashClient,
    });
    const run = (pathname: string) => {
        const location = { pathname, search: '', hash: '', state: undefined, localePrefix: '' };
        const { context } = createActor(publicAppStateMachine, {
            input: { location, initialSessionsLength: 0, forkState: null },
        }).getSnapshot();
        return toPromise(createActor(resolve, { input: context }).start());
    };

    it('reads the sessions outside the fork routes', async () => {
        await expect(run(SSO_PATHS.LOGIN)).resolves.toMatchObject({
            forkState: null,
            sessions: [],
            loginResult: { type: 'sessions-switcher' },
        });
    });

    // Without the 3 seconds and page reloads that wrapUnloadError gives errors that aren't from the API
    it('rejects a fork link without its parameters right away', async () => {
        await expect(run(SSO_PATHS.AUTHORIZE)).rejects.toBeInstanceOf(InvalidForkError);
        await expect(run(SSO_PATHS.DESKTOP_SIGN_IN)).rejects.toThrow('Invalid app specified');
    });
});
