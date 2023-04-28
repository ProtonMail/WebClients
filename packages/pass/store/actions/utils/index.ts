import type { AnyAction } from 'redux';

import { or } from '@proton/pass/utils/fp';

import { signout } from '../creators/auth';
import { stateDestroy, stateLock } from '../creators/worker';

export const isStateResetAction = (action: AnyAction) => or(stateDestroy.match, stateLock.match, signout.match)(action);
