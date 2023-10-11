import type { AnyAction } from 'redux';

import { signoutSuccess } from '@proton/pass/store/actions/creators/auth';
import { stateDestroy, stateLock } from '@proton/pass/store/actions/creators/worker';
import { or } from '@proton/pass/utils/fp';

export const isStateResetAction = (action: AnyAction) =>
    or(stateDestroy.match, stateLock.match, signoutSuccess.match)(action);
