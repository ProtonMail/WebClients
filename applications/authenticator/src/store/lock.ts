import biometrics from 'proton-authenticator/lib/locks/biometrics';
import password from 'proton-authenticator/lib/locks/password';
import type { AppLockDTO } from 'proton-authenticator/lib/locks/types';
import { boot } from 'proton-authenticator/store/app';

import { createAppAsyncThunk } from './utils';

const unlockElseThrow = async (lock: AppLockDTO) => {
    switch (lock.mode) {
        case 'none':
            return;
        case 'biometrics':
            return biometrics.verify('unlock');
        case 'password':
            return password.verify(lock.password);
    }
};

/** NOTE: we want to await the async `boot` thunk in order
 * to potentially resolve any storage key issues. */
export const unlock = createAppAsyncThunk('auth/unlock', async (lock: AppLockDTO, { dispatch }) => {
    await unlockElseThrow(lock);
    await dispatch(boot());
});

export const verifyUnlock = createAppAsyncThunk('auth/verifyUnlock', (lock: AppLockDTO) => unlockElseThrow(lock));
