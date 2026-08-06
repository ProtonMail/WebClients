import type { ComponentType } from 'react';

import EventManagerContext from '@proton/components/containers/eventManager/context';

import { mockEventManager } from '../../event-manager';

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
