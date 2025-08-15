import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import type { MailFiltersState } from '@proton/mail/store/filters';
import { baseUseDispatch } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

// Custom dispatch because delegated access isn't in shared reducers. One day it might be though.
type DelegatedAccessDispatch = ReturnType<
    typeof baseUseDispatch<ThunkDispatch<MailFiltersState, ProtonThunkArguments, Action>>
>;
export const useDispatch: () => DelegatedAccessDispatch = baseUseDispatch;
