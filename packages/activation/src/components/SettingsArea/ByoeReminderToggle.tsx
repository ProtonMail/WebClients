import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateByoeNewMessageReminder } from '@proton/shared/lib/api/mailSettings';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import noop from '@proton/utils/noop';

const TOGGLE_ID = 'byoe-new-message-reminder-toggle';

const ByoeReminderToggle = () => {
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
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor={TOGGLE_ID}>
                        <span className="mr-2">{c('BYOE reminder').t`Private email reminders in Gmail`}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        id={TOGGLE_ID}
                        checked={!!mailSettings?.ByoeNewMessageReminder}
                        loading={loading || mailSettingsLoading}
                        onChange={({ target }) => {
                            // The api layer already notifies the user on failure, and the store keeps the previous value.
                            withLoading(handleChange(target.checked)).catch(noop);
                        }}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            <div className="color-weak">
                <p className="m-0">
                    {c('BYOE reminder')
                        .t`Don’t miss private emails while you still check Gmail. Emails from other ${MAIL_APP_NAME} users stay in ${MAIL_APP_NAME}, so we’ll remind you in Gmail with the subject and a link.`}
                </p>
                <p className="mt-4 mb-0">{c('BYOE reminder').t`Applies to all your connected Gmail addresses.`}</p>
            </div>
        </>
    );
};

export default ByoeReminderToggle;
