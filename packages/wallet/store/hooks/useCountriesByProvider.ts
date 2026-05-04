import { createHooks } from '@proton/redux-utilities/hooks';

import { countriesByProviderThunk, selectCountriesByProvider } from '../slices/countriesByProvider';

const hooks = createHooks(countriesByProviderThunk, selectCountriesByProvider);

export const useCountriesByProvider = hooks.useValue;
export const useGetCountriesByProvider = hooks.useGet;
