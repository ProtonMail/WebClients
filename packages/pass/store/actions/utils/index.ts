import type { AnyAction } from 'redux';

import { signoutSuccess } from '@proton/pass/store/actions/creators/auth';
import { stateDestroy, stateLock } from '@proton/pass/store/actions/creators/client';
import { or } from '@proton/pass/utils/fp/predicates';

export const isStateResetAction = (action: AnyAction) =>
    or(stateDestroy.match, stateLock.match, signoutSuccess.match)(action);
