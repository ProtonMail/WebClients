import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import type { KtState } from '@proton/account/kt';
import { baseUseDispatch } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import type { DelegatedAccessState } from './index';

// Custom dispatch because delegated access isn't in shared reducers. One day it might be though.
type DelegatedAccessDispatch = ReturnType<
    typeof baseUseDispatch<ThunkDispatch<DelegatedAccessState & KtState, ProtonThunkArguments, Action>>
>;
export const useDispatch: () => DelegatedAccessDispatch = baseUseDispatch;
