import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';

export interface AccountThunkArguments extends ProtonThunkArguments {
    coreEventV6Manager: EventManager<CoreEventV6Response> | undefined;
}

export const extraThunkArguments = {} as AccountThunkArguments;
