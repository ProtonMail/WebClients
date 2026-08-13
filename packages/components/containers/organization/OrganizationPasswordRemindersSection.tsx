import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { usePasswordReminderTelemetry } from '@proton/account/passwordReminder/passwordReminderTelemetry';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import Info from '@proton/components/components/link/Info';
import Loader from '@proton/components/components/loader/Loader';
import { PermissionBanner, PermissionTooltip } from '@proton/components/components/orgPermissions';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { OrganizationExtended, OrganizationSettings } from '@proton/shared/lib/interfaces';

interface Props {
    organization?: OrganizationExtended;
}

const OrganizationPasswordRemindersSection = ({ organization }: Props) => {
    const api = useApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { sendEnforcementChange } = usePasswordReminderTelemetry();

    const [{ permissions }] = useUserPermissions();
    const canSavePolicy =
        permissions?.['account.security_policy.create'] || permissions?.['account.security_policy.update'];

    if (!organization) {
        return <Loader />;
    }

    const isEnforced = !!organization.Settings?.PasswordReminderEnforced;

    const handleToggle = async () => {
        const nextEnforced = !isEnforced;

        try {
            dispatch(
                organizationActions.updateOrganizationSettings({ value: { PasswordReminderEnforced: nextEnforced } })
            );
            const organizationSettings = await api<OrganizationSettings>(
                updateOrganizationSettings({ PasswordReminderEnforced: nextEnforced })
            );
            dispatch(organizationActions.updateOrganizationSettings({ value: organizationSettings }));
            sendEnforcementChange(nextEnforced);
            createNotification({
                text: nextEnforced
                    ? c('Notification').t`Password check-ins are now required for all members`
                    : c('Notification').t`Password check-ins are not required anymore`,
            });
        } catch {
            // Revert the optimistic update if the request fails (e.g. cancelled 2FA prompt)
            dispatch(
                organizationActions.updateOrganizationSettings({ value: { PasswordReminderEnforced: isEnforced } })
            );
        }
    };

    return (
        <>
            <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/password-check-in')} inlineLearnMore>
                {c('Info')
                    .t`Members are periodically prompted to verify their ${BRAND_NAME} password to ensure they don't forget it. Enforcing check-ins prevents members from turning them off.`}
            </SettingsParagraph>

            <PermissionBanner
                hasPermission={!!canSavePolicy}
                className="mb-4 max-w-custom"
                style={{ '--max-w-custom': '43em' }}
            />
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="password-reminders-enforcement" className="text-semibold flex items-center">
                        <span className="mr-0.5">{c('Label').t`Require password check-ins`}</span>
                        <Info
                            title={c('Info')
                                .t`When enabled, members cannot opt out of password check-ins in their own settings.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <PermissionTooltip hasPermission={!!canSavePolicy}>
                        <Toggle
                            id="password-reminders-enforcement"
                            checked={isEnforced}
                            loading={loading}
                            disabled={!canSavePolicy}
                            onChange={() => withLoading(handleToggle())}
                        />
                    </PermissionTooltip>
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default OrganizationPasswordRemindersSection;
