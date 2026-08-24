import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { getIsPasswordReminderEnforced } from '@proton/account/passwordReminder/helpers/getIsPasswordReminderEnforced';
import { usePasswordReminder } from '@proton/account/passwordReminder/hooks';
import { usePasswordReminderTelemetry } from '@proton/account/passwordReminder/passwordReminderTelemetry';
import { setPasswordReminderFlag } from '@proton/account/passwordReminder/setPasswordReminderFlag';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { Href } from '@proton/atoms/Href/Href';
import useLoading from '@proton/hooks/useLoading';
import { IcBell } from '@proton/icons/icons/IcBell';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { PASSWORD_REMINDERS_VALUE } from '@proton/shared/lib/interfaces';

import useModalState from '../../../components/modalTwo/useModalState';
import useNotifications from '../../../hooks/useNotifications';
import { EnforcedByOrganization } from '../../organization/EnforcedByOrganization';
import { SettingsIconRow } from '../SettingsIconRow';
import { SettingsToggleRow } from '../SettingsToggleRow';
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
            <DashboardCard>
                <DashboardCardContent>
                    <SettingsIconRow icon={IcBell}>
                        <SettingsToggleRow
                            id="passwordRemindersToggle"
                            label={
                                <>
                                    <SettingsToggleRow.Label>{c('Label')
                                        .t`Password check-ins`}</SettingsToggleRow.Label>
                                    <SettingsToggleRow.Description>
                                        {c('Info')
                                            .t`Periodically prompts you to verify your ${BRAND_NAME} password to ensure you don't forget it. You'll be asked less frequently over time.`}{' '}
                                        <Href key="to-password-learn" href={getKnowledgeBaseUrl('/password-check-in')}>
                                            {c('Link').t`Learn more`}
                                        </Href>
                                    </SettingsToggleRow.Description>
                                </>
                            }
                            toggle={
                                <EnforcedByOrganization enforced={isEnforcedByOrganization}>
                                    <SettingsToggleRow.Toggle
                                        loading={loadingPasswordReminders}
                                        // When the org enforces check-ins, the member's opt-out is ignored
                                        // server-side, so reminders are on regardless of their own flag.
                                        checked={hasPasswordRemindersEnabled || isEnforcedByOrganization}
                                        disabled={isEnforcedByOrganization}
                                        onChange={({ target: { checked } }) => {
                                            if (!checked) {
                                                setConfirmDisablePasswordRemindersModalOpen(true);
                                                return;
                                            }

                                            void withLoadingPasswordReminders(enablePasswordReminders());
                                        }}
                                    />
                                </EnforcedByOrganization>
                            }
                        />
                    </SettingsIconRow>
                </DashboardCardContent>
            </DashboardCard>
        </>
    );
};

export default PasswordRemindersSettings;
