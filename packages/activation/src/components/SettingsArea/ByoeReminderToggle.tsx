import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

const TOGGLE_ID = 'byoe-new-message-reminder-toggle';

const ByoeReminderToggle = () => {
    const [mailSettings, mailSettingsLoading] = useMailSettings();
    const { update, loading } = useUpdateMailSetting();

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
                            update('ByoeNewMessageReminder', target.checked);
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
