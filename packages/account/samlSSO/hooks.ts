import { createHooks } from '@proton/redux-utilities';

import { samlSSOThunk, selectSamlSSO } from './index';

const hooks = createHooks(samlSSOThunk, selectSamlSSO);

export const useSamlSSO = hooks.useValue;
export const useGetSamlSSO = hooks.useGet;
