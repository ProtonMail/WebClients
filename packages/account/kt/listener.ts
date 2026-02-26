import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { getKTActivationValue, getKTFlag } from '@proton/key-transparency/helpers';
import type { MailSettingState } from '@proton/mail/store/mailSettings';
import type { ProtonThunkArguments, SharedStartListening } from '@proton/redux-shared-store-types';

import { bootstrapEvent } from '../bootstrap/action';
import { type KtState, ktSlice } from './index';

// This is a hack to avoid having to add MailSettingState to all the account states
const getMailSettingsValue = (state: KtState) => {
    return (state as Partial<MailSettingState>).mailSettings?.value;
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
