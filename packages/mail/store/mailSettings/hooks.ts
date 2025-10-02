import { createHooks } from '@proton/redux-utilities';

import { mailSettingsThunk, selectMailSettings } from './index';

const hooks = createHooks(mailSettingsThunk, selectMailSettings);

export const useMailSettings = hooks.useValueWithDefault;
export const useGetMailSettings = hooks.useGet;
