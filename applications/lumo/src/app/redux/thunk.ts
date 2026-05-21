import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import type { LumoEventResponse } from '@proton/shared/lib/interfaces/Lumo';

import type { DbApi } from '../indexedDb/db';
import type { LumoApi } from '../remote/api';

export interface LumoThunkArguments extends ProtonThunkArguments {
    dbApi: DbApi;
    lumoApi: LumoApi;
    lumoEventManager?: EventManager<LumoEventResponse>;
}

// @ts-ignore: will be defined at bootstrap
export const extraThunkArguments = {
    dbApi: undefined,
    lumoApi: undefined,
} as LumoThunkArguments;
