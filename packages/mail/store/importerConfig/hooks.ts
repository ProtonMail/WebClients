import { createHooks } from '@proton/redux-utilities';

import { importConfigThunk, selectImporterConfig } from './index';

const hooks = createHooks(importConfigThunk, selectImporterConfig);

export const useApiEnvironmentConfig = hooks.useValue;
export const useGetApiEnvironmentConfig = hooks.useGet;
