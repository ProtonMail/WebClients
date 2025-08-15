import type { CalendarModelEventManager } from '@proton/calendar';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type {
    CalendarEventV6Response,
    ContactEventV6Response,
    CoreEventV6Response,
    MailEventV6Response,
} from '@proton/shared/lib/api/events';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';

export interface AccountThunkArguments extends ProtonThunkArguments {
    coreEventV6Manager: EventManager<CoreEventV6Response> | undefined;
    mailEventV6Manager: EventManager<MailEventV6Response> | undefined;
    contactEventV6Manager: EventManager<ContactEventV6Response> | undefined;
    calendarEventV6Manager: EventManager<CalendarEventV6Response> | undefined;
    calendarModelEventManager: CalendarModelEventManager;
}

export const extraThunkArguments = {} as AccountThunkArguments;
