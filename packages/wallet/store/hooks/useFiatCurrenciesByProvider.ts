import { createHooks } from '@proton/redux-utilities';

import { fiatCurrenciesByProviderThunk, selectFiatCurrenciesByProvider } from '../slices/fiatCurrenciesByProvider';

const hooks = createHooks(fiatCurrenciesByProviderThunk, selectFiatCurrenciesByProvider);

export const useFiatCurrenciesByProvider = hooks.useValue;
export const useGetFiatCurrenciesByProvider = hooks.useGet;
