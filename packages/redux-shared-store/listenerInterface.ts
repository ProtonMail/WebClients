import type { TypedStartListening } from '@reduxjs/toolkit';

import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';

export type SharedStartListening<RequiredState> = TypedStartListening<
    RequiredState,
    ProtonDispatch<any>,
    ProtonThunkArguments
>;
