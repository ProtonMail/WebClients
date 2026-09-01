import type { ComponentType } from 'react';

import { mockEventManager } from '@proton/testing/lib/event-manager';

import EventManagerContext from '../containers/eventManager/context';

export const withEventManager =
    (eventManager = mockEventManager) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function EventManagerProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <EventManagerContext.Provider value={eventManager}>
                    <Component {...props} />
                </EventManagerContext.Provider>
            );
        };
