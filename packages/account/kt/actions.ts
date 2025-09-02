import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { KTUserContext, KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import { type UserState, userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import type { KtState } from './index';

export const getKTActivation = (): ThunkAction<
    KeyTransparencyActivation,
    KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return (dispatch, getState) => {
        return getState().kt.value;
    };
};

export const getKTUserContext = (): ThunkAction<
    Promise<KTUserContext>,
    KtState & UserState & UserKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        return {
            ktActivation: dispatch(getKTActivation()),
            appName: extra.config.APP_NAME,
            getUserKeys: () => dispatch(userKeysThunk()),
            getUser: () => dispatch(userThunk()),
        };
    };
};
