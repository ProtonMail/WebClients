import { createHooks } from '@proton/redux-utilities';

import { holidaysDirectoryThunk, selectHolidaysDirectory } from './index';

const hooks = createHooks(holidaysDirectoryThunk, selectHolidaysDirectory);

export const useHolidaysDirectory = hooks.useValue;
export const useGetHolidaysDirectory = hooks.useGet;
