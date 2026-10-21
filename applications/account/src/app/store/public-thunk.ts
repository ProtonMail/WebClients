import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

export interface AccountThunkPublicArguments extends ProtonThunkArguments {
    unauthenticatedApi: UnauthenticatedApi;
}

export const extraThunkArguments = {} as AccountThunkPublicArguments;
