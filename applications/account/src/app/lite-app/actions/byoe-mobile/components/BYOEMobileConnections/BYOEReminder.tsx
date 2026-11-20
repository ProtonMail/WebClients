import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import Toggle from '@proton/components/components/toggle/Toggle';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateByoeNewMessageReminder } from '@proton/shared/lib/api/mailSettings';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import noop from '@proton/utils/noop';

const TOGGLE_ID = 'byoe-new-message-reminder-toggle';

export const BYOEReminder = () => {
    const api = useApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [mailSettings, mailSettingsLoading] = useMailSettings();
    const [loading, withLoading] = useLoading();

    const handleChange = async (checked: boolean) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateByoeNewMessageReminder(checked));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <div className="flex flex-nowrap items-center gap-4 bg-norm rounded-xl px-4 py-3 mb-3">
            <label className="flex-1 min-w-0" htmlFor={TOGGLE_ID}>
                <span className="block">{c('BYOE reminder').t`Private email reminders in Gmail`}</span>
                <span className="block text-sm color-weak">
                    {c('BYOE reminder')
                        .t`Get a reminder in Gmail when another ${MAIL_APP_NAME} user emails you. Applies to all connected addresses.`}
                </span>
            </label>
            <Toggle
                id={TOGGLE_ID}
                checked={!!mailSettings?.ByoeNewMessageReminder}
                loading={loading || mailSettingsLoading}
                onChange={({ target }) => {
                    // The api layer already notifies the user on failure, and the store keeps the previous value.
                    withLoading(handleChange(target.checked)).catch(noop);
                }}
            />
        </div>
    );
};
