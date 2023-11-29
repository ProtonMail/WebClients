import { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import { Api } from '@proton/shared/lib/interfaces';

export interface CalendarThunkArguments {
    api: Api;
    eventManager: EventManager;
}

export const extraThunkArguments = {} as CalendarThunkArguments;
