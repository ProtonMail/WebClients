import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { removeUserKeyRoute } from '@proton/shared/lib/api/keys';

import { userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';

export const deleteInactiveUserKeyAction = ({
    id,
}: {
    id: string;
}): ThunkAction<Promise<void>, UserKeysState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        try {
            extra.eventManager.stop();
            const api = getSilentApi(extra.api);
            const userKeys = await dispatch(userKeysThunk());

            if (userKeys.find((userKey) => userKey.ID === id)) {
                throw new Error('Key is decryptable and cannot be deleted');
            }

            await api(removeUserKeyRoute({ ID: id }));
            await dispatch(userThunk({ cache: CacheType.None }));
        } finally {
            extra.eventManager.start();
        }
    };
};
