import type { PassSaga } from '@proton/pass/store/types';

import signout from './auth/signout.saga';
import wakeup from './client/wakeup.saga';
import itemAutofilled from './items/item-autofill.saga';

export const EXTENSION_SAGAS: PassSaga[] = [itemAutofilled, signout, wakeup];
