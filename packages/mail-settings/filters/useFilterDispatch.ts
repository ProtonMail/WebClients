import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import type { MailFiltersState } from '@proton/mail/store/filters';
import { baseUseDispatch } from '@proton/react-redux-store/ProtonStoreContext';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';

// Custom dispatch because delegated access isn't in shared reducers. One day it might be though.
type DelegatedAccessDispatch = ReturnType<
    typeof baseUseDispatch<ThunkDispatch<MailFiltersState, ProtonThunkArguments, Action>>
>;
export const useFilterDispatch: () => DelegatedAccessDispatch = baseUseDispatch;
