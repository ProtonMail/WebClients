import { createHooks } from '@proton/redux-utilities/hooks';

import { selectUserKeys, userKeysThunk } from './index';

const hooks = createHooks(userKeysThunk, selectUserKeys);

export const useUserKeys = hooks.useValue;
export const useGetUserKeys = hooks.useGet;
