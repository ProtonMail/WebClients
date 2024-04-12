import type { TypedStartListening } from '@reduxjs/toolkit';

import type { ProtonDispatch, ProtonThunkArguments } from './interface';

export type SharedStartListening<RequiredState> = TypedStartListening<
    RequiredState,
    ProtonDispatch<any>,
    ProtonThunkArguments
>;
