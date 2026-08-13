import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { getIsPasswordReminderEnforced } from '@proton/account/passwordReminder/helpers/getIsPasswordReminderEnforced';
import { usePasswordReminder } from '@proton/account/passwordReminder/hooks';
import { usePasswordReminderTelemetry } from '@proton/account/passwordReminder/passwordReminderTelemetry';
import { setPasswordReminderFlag } from '@proton/account/passwordReminder/setPasswordReminderFlag';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import Info from '@proton/components/components/link/Info';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { EnforcedByOrganization } from '@proton/components/containers/organization/EnforcedByOrganization';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { PASSWORD_REMINDERS_VALUE } from '@proton/shared/lib/interfaces';

import ConfirmDisablePasswordRemindersModal from './ConfirmDisablePasswordRemindersModal';

const PasswordRemindersSettings = () => {
    const [userSettings] = useUserSettings();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loadingPasswordReminders, withLoadingPasswordReminders] = useLoading();
    const [
        confirmDisablePasswordRemindersModal,
        setConfirmDisablePasswordRemindersModalOpen,
        renderConfirmDisablePasswordRemindersModal,
    ] = useModalState();

    const { isAvailable } = usePasswordReminder();
    const { sendEnable } = usePasswordReminderTelemetry();
    const [organization] = useOrganization();

    const isEnforcedByOrganization = getIsPasswordReminderEnforced({ organization });

    if (!isAvailable) {
        return null;
    }

    const enablePasswordReminders = async () => {
        await dispatch(setPasswordReminderFlag({ value: PASSWORD_REMINDERS_VALUE.ENABLED }));
        createNotification({ text: c('Success').t`Password check-ins enabled` });
        sendEnable();
    };

    const hasPasswordRemindersEnabled = userSettings.Flags.PasswordReminderOptOut === PASSWORD_REMINDERS_VALUE.ENABLED;

    return (
        <>
            {renderConfirmDisablePasswordRemindersModal && (
                <ConfirmDisablePasswordRemindersModal {...confirmDisablePasswordRemindersModal} />
            )}
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="passwordRemindersToggle" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Password check-ins`}</span>
                        <Info
                            title={c('Info')
                                .t`Periodically prompts you to verify your ${BRAND_NAME} password to ensure you don't forget it. You'll be asked less frequently over time.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <EnforcedByOrganization enforced={isEnforcedByOrganization}>
                        <Toggle
                            loading={loadingPasswordReminders}
                            // When the org enforces check-ins, the member's opt-out is ignored
                            // server-side, so reminders are on regardless of their own flag.
                            checked={hasPasswordRemindersEnabled || isEnforcedByOrganization}
                            disabled={isEnforcedByOrganization}
                            id="passwordRemindersToggle"
                            onChange={({ target: { checked } }) => {
                                if (!checked) {
                                    setConfirmDisablePasswordRemindersModalOpen(true);
                                    return;
                                }

                                void withLoadingPasswordReminders(enablePasswordReminders());
                            }}
                        />
                    </EnforcedByOrganization>
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default PasswordRemindersSettings;
