import { c, msgid } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useDispatch } from '@proton/account/store/hooks';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { Loader } from '@proton/atoms/Loader/Loader';
import Info from '@proton/components/components/link/Info';
import PermissionBanner from '@proton/components/components/orgPermissions/PermissionBanner';
import PermissionTooltip from '@proton/components/components/orgPermissions/PermissionTooltip';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import useLoading from '@proton/hooks/useLoading';
import { sendRecoveryMethodReminder, updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { OrganizationExtended, OrganizationSettings } from '@proton/shared/lib/interfaces/Organization';
import { useFlag } from '@proton/unleash/useFlag';

import { useMembersWithoutRecovery } from './membersWithoutRecovery';

interface Props {
    organization?: OrganizationExtended;
}

/** How the organization's non-private members reset a forgotten password: with an administrator, or their phrase. */
const OrganizationAccountRecoverySection = ({ organization }: Props) => {
    const api = useApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [sendingReminder, withSendingReminder] = useLoading();
    const isSendReminderEnabled = useFlag('MemberResetSendReminder');
    const [membersWithoutRecovery] = useMembersWithoutRecovery();

    const [{ permissions }] = useUserPermissions();
    const canSavePolicy = permissions?.['account.security_policy.update'];

    if (!organization) {
        return <Loader />;
    }

    const isAdminRequired = !organization.Settings?.AdminOptionalForPasswordChange;

    const handleSendReminder = async () => {
        await api(sendRecoveryMethodReminder());
        createNotification({ text: c('Notification').t`Reminder has been sent` });
    };

    const handleToggle = async () => {
        const nextAdminOptional = isAdminRequired;
        try {
            dispatch(
                organizationActions.updateOrganizationSettings({
                    value: { AdminOptionalForPasswordChange: nextAdminOptional },
                })
            );
            const organizationSettings = await api<OrganizationSettings>(
                updateOrganizationSettings({ AdminOptionalForPasswordChange: nextAdminOptional })
            );
            dispatch(organizationActions.updateOrganizationSettings({ value: organizationSettings }));
            createNotification({
                text: nextAdminOptional
                    ? c('Notification').t`Members can now reset their password with their recovery phrase`
                    : c('Notification').t`Password resets now require administrator approval`,
            });
        } catch {
            dispatch(
                organizationActions.updateOrganizationSettings({
                    value: { AdminOptionalForPasswordChange: !nextAdminOptional },
                })
            );
        }
    };

    return (
        <>
            <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/set-account-recovery-methods')}>
                {c('Info').t`Manage account recovery settings for your organization members.`}
            </SettingsParagraph>

            {!!membersWithoutRecovery && (
                <Card
                    rounded
                    background
                    bordered={false}
                    className="mb-4 max-w-custom flex items-center justify-space-between gap-2"
                    style={{ '--max-w-custom': '43em' }}
                >
                    <span>
                        {c('Info').ngettext(
                            msgid`${membersWithoutRecovery} member has not set up a recovery method.`,
                            `${membersWithoutRecovery} members have not set up a recovery method.`,
                            membersWithoutRecovery
                        )}
                    </span>
                    {isSendReminderEnabled && (
                        <PermissionTooltip hasPermission={!!canSavePolicy}>
                            <Button
                                loading={sendingReminder}
                                disabled={!canSavePolicy}
                                onClick={() => withSendingReminder(handleSendReminder())}
                            >{c('Action').t`Send reminder`}</Button>
                        </PermissionTooltip>
                    )}
                </Card>
            )}

            <PermissionBanner
                hasPermission={!!canSavePolicy}
                className="mb-4 max-w-custom"
                style={{ '--max-w-custom': '43em' }}
            />
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="member-reset-admin-required" className="text-semibold flex items-center">
                        <span className="mr-0.5">{c('Label').t`Require admin approval`}</span>
                        <Info
                            title={c('Info')
                                .t`If enabled, members can't reset their password without an administrator's approval.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <PermissionTooltip hasPermission={!!canSavePolicy}>
                        <Toggle
                            id="member-reset-admin-required"
                            checked={isAdminRequired}
                            loading={loading}
                            disabled={!canSavePolicy}
                            onChange={() => withLoading(handleToggle())}
                        >
                            {isAdminRequired ? c('Status').t`Enabled` : c('Status').t`Disabled`}
                        </Toggle>
                    </PermissionTooltip>
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default OrganizationAccountRecoverySection;
