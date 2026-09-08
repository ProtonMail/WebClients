import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { getKTActivationValue, getKTFlag } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments, SharedStartListening } from '@proton/redux-shared-store-types';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import type { MailSettings } from '@proton/shared/lib/interfaces';

import { bootstrapEvent } from '../bootstrap/action';
import { type KtState, ktSlice } from './index';

interface MailSettingsStateSlice {
    mailSettings?: ModelState<MailSettings>;
}

// Apps that mount mailSettings in the shared store expose KT here; others leave it undefined.
const getMailSettingsValue = (state: KtState) => {
    return (state as MailSettingsStateSlice).mailSettings?.value;
};

const updateKtStateThunk = (): ThunkAction<void, KtState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const unleashClient = extra.unleashClient;
        const logOnly = unleashClient?.isEnabled('KeyTransparencyLogOnly') ?? false;
        const showUI = unleashClient?.isEnabled('KeyTransparencyShowUI') ?? false;
        const featureFlag = getKTFlag({ logOnly, showUI });
        const mailSettings = getMailSettingsValue(getState());
        const nextValue = await getKTActivationValue({
            featureFlag,
            appName: extra.config?.APP_NAME,
            mailSettings,
        });
        dispatch(ktSlice.actions.value(nextValue));
    };
};

export const ktListener = (startListening: SharedStartListening<KtState>) => {
    startListening({
        predicate: (action, currentState, prevState) => {
            return (
                bootstrapEvent.match(action) ||
                getMailSettingsValue(currentState)?.KT !== getMailSettingsValue(prevState)?.KT
            );
        },
        effect: async (_, listenerApi) => {
            listenerApi.dispatch(updateKtStateThunk());
        },
    });

    startListening({
        actionCreator: bootstrapEvent,
        effect: async (_, listenerApi) => {
            listenerApi.unsubscribe();
            const unleashClient = listenerApi.extra.unleashClient;
            unleashClient?.on('update', () => {
                listenerApi.dispatch(updateKtStateThunk());
            });
        },
    });
};
