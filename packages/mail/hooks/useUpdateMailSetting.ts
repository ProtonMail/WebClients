import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useLoadingByKey } from '@proton/hooks/useLoading';
import { baseUseDispatch } from '@proton/react-redux-store/ProtonStoreContext';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import noop from '@proton/utils/noop';

import type { MailSettingState } from '../store/mailSettings';
import type {
    MailSettingRequest,
    MailSettingValue,
    UpdatableMailSetting,
} from '../store/mailSettings/mailSettingUpdaters';
import { updateMailSetting, updateMailSettingWithRequest } from '../store/mailSettings/updateMailSetting';

interface UpdateOptions {
    /**
     * Success notification, shown once the setting is saved and never when the request fails.
     * `true` (default) shows "Preference saved", a string shows that text instead, `false` shows nothing.
     */
    notify?: boolean | string;
    /** Runs once the setting is saved, never when the request fails. */
    onSuccess?: () => void;
    /** Do not display the error of the api to the user. */
    silence?: boolean;
}

/**
 * Central way to update mail settings.
 *
 * ```ts
 * const { update, isLoading } = useUpdateMailSetting();
 * update('ShowMoved', SHOW_MOVED.NONE);
 * update('PageSize', MAIL_PAGE_SIZE.FIFTY, { notify: false });
 * update('Sign', SIGN.ENABLED, { notify: c('Info').t`Encryption setting updated` });
 * <Toggle loading={isLoading('ShowMoved')} />
 * ```
 *
 * `isLoading(key)` is per setting, so several controls can share one hook. `loading` covers every setting.
 *
 * The new value is stored right away and restored if the request fails. Nothing is returned: the hook
 * handles the outcome itself (success notification, `loading`), and the api layer displays the errors.
 */
export const useUpdateMailSetting = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<MailSettingState, ProtonThunkArguments, UnknownAction>>();
    const { createNotification } = useNotifications();
    const [loadingByKey, withLoadingByKey] = useLoadingByKey();

    const run = (
        loadingKey: string,
        thunk: ReturnType<typeof updateMailSetting>,
        { notify = true, onSuccess }: UpdateOptions = {}
    ) => {
        const saved = dispatch(thunk)
            .then(() => {
                if (notify) {
                    createNotification({
                        text: typeof notify === 'string' ? notify : c('Success').t`Preference saved`,
                    });
                }
                onSuccess?.();
            })
            // The store is already restored and the api layer shows the error, nothing is left to do
            .catch(noop);
        void withLoadingByKey(loadingKey, saved);
    };

    const update = <K extends UpdatableMailSetting>(key: K, value: MailSettingValue<K>, options?: UpdateOptions) => {
        run(key, updateMailSetting(key, value, options), options);
    };

    /**
     * Escape hatch for a request that is not covered by the registry of `update`.
     * It is only part of `loading`, there is no key to ask `isLoading` about.
     */
    const updateWithRequest = (request: MailSettingRequest, options?: UpdateOptions) => {
        run(request.url, updateMailSettingWithRequest(request, options), options);
    };

    /** Whether a request is in flight for this setting. */
    const isLoading = (key: UpdatableMailSetting) => !!loadingByKey[key];

    /** Whether a request is in flight for any setting. */
    const loading = Object.values(loadingByKey).some(Boolean);

    return { update, updateWithRequest, loading, isLoading };
};
