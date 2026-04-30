import { createHooks } from '@proton/redux-utilities/hooks';

import { allowAddressDeletionThunk, selectAllowAddressDeletion } from './index';

const hooks = createHooks(allowAddressDeletionThunk, selectAllowAddressDeletion);

export const useAllowAddressDeletion = hooks.useValue;
export const useGetAllowAddressDeletion = hooks.useGet;
