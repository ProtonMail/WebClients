import { type ReactNode, createContext, useContext } from 'react';

import type {
    CalendarEventV6Response,
    ContactEventV6Response,
    CoreEventV6Response,
    MailEventV6Response,
} from '@proton/shared/lib/api/events';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';

interface EventManagerV6ProviderProps {
    coreEventV6Manager: EventManager<CoreEventV6Response> | undefined;
    mailEventV6Manager: EventManager<MailEventV6Response> | undefined;
    contactEventV6Manager: EventManager<ContactEventV6Response> | undefined;
    calendarEventV6Manager: EventManager<CalendarEventV6Response> | undefined;
}

const EventManagerV6Context = createContext<EventManagerV6ProviderProps>({
    coreEventV6Manager: undefined,
    mailEventV6Manager: undefined,
    contactEventV6Manager: undefined,
    calendarEventV6Manager: undefined,
});

interface Props extends EventManagerV6ProviderProps {
    children: ReactNode;
}

export const EventManagerV6Provider = ({
    coreEventV6Manager,
    mailEventV6Manager,
    contactEventV6Manager,
    calendarEventV6Manager,
    children,
}: Props) => {
    return (
        <EventManagerV6Context.Provider
            value={{
                coreEventV6Manager,
                mailEventV6Manager,
                contactEventV6Manager,
                calendarEventV6Manager,
            }}
        >
            {children}
        </EventManagerV6Context.Provider>
    );
};

export const useEventManagerV6 = () => {
    return useContext(EventManagerV6Context);
};
