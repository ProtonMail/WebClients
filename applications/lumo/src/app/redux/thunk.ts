import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import type { DbApi } from '../indexedDb/db';
import type { LumoApi } from '../remote/api';

export interface LumoThunkArguments extends ProtonThunkArguments {
    dbApi: DbApi;
    lumoApi: LumoApi;
}

// @ts-ignore: will be defined at bootstrap
export const extraThunkArguments = {
    dbApi: undefined,
    lumoApi: undefined,
} as LumoThunkArguments;
