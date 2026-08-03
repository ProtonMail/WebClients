import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { type UserSettingsState, userSettingsThunk } from '@proton/account/userSettings';
import { setSecurityKeyRequirePinFlag } from '@proton/components/containers/account/fido/setSecurityKeyRequirePinFlag';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { removeSecurityKey } from '@proton/shared/lib/api/settings';
import { lockSensitiveSettings } from '@proton/shared/lib/api/user';
import noop from '@proton/utils/noop';

interface Key {
    id: string;
    name: string;
}

export const removeAllSecurityKeysThunk = (
    keys: Key[]
): ThunkAction<Promise<void>, UserSettingsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        for (const key of keys) {
            // Sequentially to avoid race conditions
            await extra.api(removeSecurityKey(key.id));
        }
        await extra.api(lockSensitiveSettings());
        const userSettings = await dispatch(userSettingsThunk({ cache: CacheType.None }));
        const registeredKeys = userSettings['2FA']?.RegisteredKeys || [];
        if (registeredKeys.length === 0) {
            dispatch(setSecurityKeyRequirePinFlag(false)).catch(noop);
        }
    };
};
