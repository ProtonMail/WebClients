import { createHooks } from '@proton/redux-utilities';

import { fiatCurrenciesThunk, selectFiatCurrencies } from '../slices';

const hooks = createHooks(fiatCurrenciesThunk, selectFiatCurrencies);

export const useFiatCurrencies = hooks.useValue;
export const useGetFiatCurrencies = hooks.useGet;
