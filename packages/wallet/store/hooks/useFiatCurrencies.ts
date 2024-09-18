import { createHooks } from '@proton/redux-utilities';

import { fiatCurrenciesThunk, selectSortedFiatCurrencies } from '../slices';

const hooks = createHooks(fiatCurrenciesThunk, selectSortedFiatCurrencies);

export const useFiatCurrencies = hooks.useValue;
export const useGetFiatCurrencies = hooks.useGet;
