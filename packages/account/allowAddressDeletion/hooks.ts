import { createHooks } from '@proton/redux-utilities';

import { allowAddressDeletionThunk, selectAllowAddressDeletion } from './index';

const hooks = createHooks(allowAddressDeletionThunk, selectAllowAddressDeletion);

export const useAllowAddressDeletion = hooks.useValue;
export const useGetAllowAddressDeletion = hooks.useGet;
