import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { pick } from '@proton/shared/lib/helpers/object';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

import { type MailSettingState, mailSettingsActions, selectMailSettings } from './index';
import {
    MAIL_SETTING_UPDATERS,
    type MailSettingRequest,
    type MailSettingValue,
    type UpdatableMailSetting,
} from './mailSettingUpdaters';

type MailSettingThunk = ThunkAction<Promise<MailSettings>, MailSettingState, ProtonThunkArguments, UnknownAction>;

export interface UpdateMailSettingOptions {
    /** Do not display the error of the api to the user. */
    silence?: boolean;
}

interface UpdateWithRequestOptions extends UpdateMailSettingOptions {
    /**
     * The settings the request is about. Only these are stored from the response, so a response that arrives late
     * cannot put another setting back to the value it had when the request was handled.
     * Without it, the whole response is stored.
     */
    keys?: readonly (keyof MailSettings)[];
}

/**
 * Sends a request that updates mail settings and stores the settings returned by the server.
 * Returns the updated settings.
 */
export const updateMailSettingWithRequest = (
    request: MailSettingRequest,
    { silence = false, keys }: UpdateWithRequestOptions = {}
): MailSettingThunk => {
    return async (dispatch, _, extra) => {
        const api: Api = silence ? (config) => extra.api({ ...config, silence: true }) : extra.api;
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(request);
        dispatch(
            mailSettingsActions.updateMailSettings(keys ? (pick(MailSettings, keys) as MailSettings) : MailSettings)
        );
        return MailSettings;
    };
};

/**
 * Stores the new value right away and sends the request. The previous value is restored if the request fails,
 * unless the setting was changed again in the meantime.
 */
export const updateMailSetting = <K extends UpdatableMailSetting>(
    key: K,
    value: MailSettingValue<K>,
    options?: UpdateMailSettingOptions
): MailSettingThunk => {
    const buildRequest = MAIL_SETTING_UPDATERS[key] as (value: MailSettingValue<K>) => MailSettingRequest;

    return async (dispatch, getState) => {
        const previousValue = selectMailSettings(getState()).value?.[key];
        // ImageProxy takes a flag and an action, the stored value is not the one given
        const isStoredAsIs = key !== 'ImageProxy';

        if (isStoredAsIs) {
            dispatch(mailSettingsActions.updateMailSettings({ [key]: value } as Partial<MailSettings> as MailSettings));
        }

        try {
            return await dispatch(updateMailSettingWithRequest(buildRequest(value), { ...options, keys: [key] }));
        } catch (error) {
            // Another update of the same setting may have been stored since: do not overwrite it
            const isStillOurValue = selectMailSettings(getState()).value?.[key] === value;
            if (isStoredAsIs && isStillOurValue) {
                dispatch(
                    mailSettingsActions.updateMailSettings({
                        [key]: previousValue,
                    } as Partial<MailSettings> as MailSettings)
                );
            }
            throw error;
        }
    };
};
