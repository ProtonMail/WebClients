import { createHooks } from '@proton/redux-utilities';

import { oauthTokenThunk, selectOAuthToken } from './index';

const hooks = createHooks(oauthTokenThunk, selectOAuthToken);

export const useOAuthToken = hooks.useValue;
export const useGetOAuthToken = hooks.useGet;
