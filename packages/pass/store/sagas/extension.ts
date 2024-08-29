import type { PassSaga } from '@proton/pass/store/types';

import signout from './auth/signout.saga';
import wakeup from './client/wakeup.saga';
import itemAutofilled from './items/item-autofill.saga';
import resolveWebsiteRules from './rules/website-rules.saga';

export const EXTENSION_SAGAS: PassSaga[] = [itemAutofilled, resolveWebsiteRules, signout, wakeup];
