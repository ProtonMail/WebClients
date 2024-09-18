import { createHooks } from '@proton/redux-utilities';

import { gatewaysPublicApiKeysThunk, selectGatewaysPublicApiKeys } from '../slices';

const hooks = createHooks(gatewaysPublicApiKeysThunk, selectGatewaysPublicApiKeys);

export const useGatewaysPublicApiKeys = hooks.useValue;
export const useGetGatewaysPublicApiKeys = hooks.useGet;
