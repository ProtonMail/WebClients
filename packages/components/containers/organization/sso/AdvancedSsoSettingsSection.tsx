import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useOrganization } from '@proton/account/organization/hooks';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { OrganizationSettings } from '@proton/shared/lib/interfaces';

import { PermissionTooltip } from '../../../components/orgPermissions/index';
import Toggle from '../../../components/toggle/Toggle';
import useApi from '../../../hooks/useApi';
import useErrorHandler from '../../../hooks/useErrorHandler';
import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';
import SettingsParagraph from '../../account/SettingsParagraph';
import SettingsSectionWide from '../../account/SettingsSectionWide';
import SubSettingsSection from '../../layout/SubSettingsSection';

const AdvancedSsoSettingsSection = () => {
    const api = useApi();
    const dispatch = useDispatch();
    const [organization] = useOrganization();
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();
    const [loading, withLoading] = useLoading();

    const [{ permissions }] = useUserPermissions();
    const canUpdate = !!permissions?.['account.sso_config.update'];

    const backupPasswordDisabled = !!organization?.Settings.SSOBackupPasswordDisabled;

    const handleToggleBackupPassword = async () => {
        const value = !backupPasswordDisabled;
        try {
            dispatch(organizationActions.updateOrganizationSettings({ value: { SSOBackupPasswordDisabled: value } }));
            const organizationSettings = await api<OrganizationSettings>(
                updateOrganizationSettings({ SSOBackupPasswordDisabled: value })
            );
            dispatch(organizationActions.updateOrganizationSettings({ value: organizationSettings }));
            createNotification({
                text: value ? c('Info').t`Backup password disabled` : c('Info').t`Backup password enabled`,
            });
        } catch (error) {
            // Revert the optimistic update. Cancelling the password confirmation modal sets
            // `error.cancel`, which useErrorHandler skips notifying about.
            dispatch(
                organizationActions.updateOrganizationSettings({
                    value: { SSOBackupPasswordDisabled: backupPasswordDisabled },
                })
            );
            handleError(error);
        }
    };

    return (
        <SubSettingsSection
            id="advanced-sso-configuration"
            title={c('Title').t`Advanced configuration`}
            className="container-section-sticky-section"
        >
            <SettingsSectionWide>
                <SettingsParagraph>
                    {c('Info').t`Manage how users can access your ${BRAND_NAME} organization with single sign-on.`}
                </SettingsParagraph>

                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="sso-backup-password-toggle" className="text-semibold">
                            {c('Label').t`Backup password`}
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="flex items-start gap-4 flex-nowrap pt-1">
                        <div className="shrink-0">
                            <PermissionTooltip hasPermission={canUpdate}>
                                <Toggle
                                    id="sso-backup-password-toggle"
                                    checked={!backupPasswordDisabled}
                                    loading={loading}
                                    disabled={!canUpdate}
                                    onChange={() => withLoading(handleToggleBackupPassword())}
                                />
                            </PermissionTooltip>
                        </div>
                        <div>
                            <label htmlFor="sso-backup-password-toggle">
                                {c('Label').t`Allow users to set a backup password`}
                            </label>
                            <p className="m-0 mt-1 text-sm color-weak">
                                {c('Info')
                                    .t`Users create a backup password the first time they sign in with single sign-on. When they later sign in on a new device, they can enter this password to complete the sign-in themselves, without needing an already signed-in device or an administrator to assist.`}
                            </p>
                        </div>
                    </SettingsLayoutRight>
                </SettingsLayout>
            </SettingsSectionWide>
        </SubSettingsSection>
    );
};

export default AdvancedSsoSettingsSection;
