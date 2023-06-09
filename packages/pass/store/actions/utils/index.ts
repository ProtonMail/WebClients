import type { AnyAction } from 'redux';

import { or } from '@proton/pass/utils/fp';

import { signoutSuccess } from '../creators/auth';
import { stateDestroy, stateLock } from '../creators/worker';

export const isStateResetAction = (action: AnyAction) =>
    or(stateDestroy.match, stateLock.match, signoutSuccess.match)(action);
