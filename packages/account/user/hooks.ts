import { createHooks } from '@proton/redux-utilities';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { selectUser, userThunk } from './index';

const hooks = createHooks(userThunk, selectUser);

// This is technically incorrect but all apps assume that it's preloaded
export const useUser = hooks.useValue as unknown as () => [UserModel, boolean];
export const useGetUser = hooks.useGet;
