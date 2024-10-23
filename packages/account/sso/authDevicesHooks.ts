import { createHooks } from '@proton/redux-utilities';

import { authDevicesThunk, selectAuthDevices } from './authDevices';

const hooks = createHooks(authDevicesThunk, selectAuthDevices);

export const useAuthDevices = hooks.useValue;
export const useGetAuthDevices = hooks.useGet;
