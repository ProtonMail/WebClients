import { createActorContext } from '@xstate/react';
import type * as H from 'history';

import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import { readForkState } from '../fork/persistedForkState';
import { stripLocaleTagPrefix } from '../localePrefix';
import type { PublicAppServices } from './PublicAppServices';
import { createPublicAppActors } from './publicAppActors';
import { createPublicAppNavigation } from './publicAppNavigation';
import { type PublicAppMachineInput, publicAppStateMachine } from './publicAppStateMachine';

export const PublicAppContext = createActorContext(publicAppStateMachine);

/** The public app machine with its actors and navigation, and its input: built once, when the app starts. */
export const createPublicAppMachine = ({
    services,
    history,
    initialSessionsLength,
}: {
    services: PublicAppServices;
    history: H.History;
    initialSessionsLength: number;
}) => {
    const { pathname, localePrefix } = stripLocaleTagPrefix(history.location.pathname);
    const input: PublicAppMachineInput = {
        location: { ...history.location, pathname, localePrefix },
        initialSessionsLength,
        forkState: readForkState(),
    };
    const logic = publicAppStateMachine.provide({
        actors: createPublicAppActors({
            api: getSilentApi(services.api),
            history,
            unleashClient: services.unleashClient,
        }),
        actions: createPublicAppNavigation(history),
    });
    return { logic, input };
};
