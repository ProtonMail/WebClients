import { createMemoryHistory } from 'history';
import { type AnyEventObject, createActor, createMachine } from 'xstate';

import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

import { createPublicAppActors } from './publicAppActors';

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
