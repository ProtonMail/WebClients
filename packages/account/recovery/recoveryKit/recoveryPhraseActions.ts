import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { reactivateMnemonicPhrase, updateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';

import type { AddressesState } from '../../addresses';
import { type UserState, userThunk } from '../../user';
import { type UserKeysState, userKeysThunk } from '../../userKeys';
import type { UserSettingsState } from '../../userSettings';
import { selectMnemonicData } from '../mnemonic';
import { type DeferredMnemonicData, generateDeferredMnemonicData } from './generateDeferredMnemonicData';

type RequiredState = UserState & UserSettingsState & UserKeysState & AddressesState;

export const generateRecoveryKitData = (): ThunkAction<
    Promise<DeferredMnemonicData>,
    RequiredState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const createMnemonicData = selectMnemonicData(getState());
        const api = extra.api;

        const data = await generateDeferredMnemonicData({
            api,
            emailAddress: createMnemonicData.emailAddress,
            username: createMnemonicData.username,
            getUserKeys: () => dispatch(userKeysThunk()),
        });
        if (!data) {
            throw new Error('Failed to prepare recovery kit data');
        }
        return data;
    };
};

export const setRecoveryPhrase = (
    recoveryPhraseData: DeferredMnemonicData,
    persistPasswordScope: boolean = false
): ThunkAction<Promise<DeferredMnemonicData>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const api = extra.api;
        const createMnemonicData = selectMnemonicData(getState());

        if (!createMnemonicData.callReactivateEndpoint) {
            await api(
                updateMnemonicPhrase({ ...recoveryPhraseData.payload, PersistPasswordScope: persistPasswordScope })
            );
        } else {
            await api(reactivateMnemonicPhrase(recoveryPhraseData.payload));
        }

        // Update the user's mnemnonic state to the latest
        await dispatch(userThunk({ cache: CacheType.None }));

        return {
            ...recoveryPhraseData,
            hasSentPayload: true,
        };
    };
};
