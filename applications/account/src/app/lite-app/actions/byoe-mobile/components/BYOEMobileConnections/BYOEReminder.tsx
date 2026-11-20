import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

const TOGGLE_ID = 'byoe-new-message-reminder-toggle';

export const BYOEReminder = () => {
    const [mailSettings, mailSettingsLoading] = useMailSettings();
    const { update, loading } = useUpdateMailSetting();

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
                    update('ByoeNewMessageReminder', target.checked);
                }}
            />
        </div>
    );
};
