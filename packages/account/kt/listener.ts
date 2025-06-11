import { getKTActivationValue, getKTFlag } from '@proton/key-transparency';
import type { MailSettingState } from '@proton/mail/store/mailSettings';
import type { SharedStartListening } from '@proton/redux-shared-store-types';

import { bootstrapEvent } from '../bootstrap/action';
import { type KtState, ktSlice } from './index';

// This is a hack to avoid having to add MailSettingState to all the account states
const getMailSettingsValue = (state: KtState) => {
    return (state as Partial<MailSettingState>).mailSettings?.value;
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
            const unleashClient = listenerApi.extra.unleashClient;
            const logOnly = unleashClient?.isEnabled('KeyTransparencyLogOnly') ?? false;
            const showUI = unleashClient?.isEnabled('KeyTransparencyShowUI') ?? false;
            const featureFlag = getKTFlag({ logOnly, showUI });
            const mailSettings = getMailSettingsValue(listenerApi.getState());
            const nextValue = getKTActivationValue({
                featureFlag,
                appName: listenerApi.extra.config?.APP_NAME,
                mailSettings,
            });
            listenerApi.dispatch(ktSlice.actions.value(nextValue));
        },
    });
};
