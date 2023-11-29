import { TypedStartListening } from '@reduxjs/toolkit';

import { ProtonDispatch, ProtonThunkArguments } from './interface';

export type SharedStartListening<RequiredState> = TypedStartListening<
    RequiredState,
    ProtonDispatch<any>,
    ProtonThunkArguments
>;
