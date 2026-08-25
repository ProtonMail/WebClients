import { useState } from 'react';

import { c } from 'ttag';

import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { useNotifications } from '@proton/app-context/useNotifications';
import { queryEnforceTwoFA, queryRemoveTwoFA } from '@proton/shared/lib/api/organization';
import { APPS, ORGANIZATION_TWOFA_SETTING } from '@proton/shared/lib/constants';
import { hasTwoFARequiredForAdminOnly, hasTwoFARequiredForAll } from '@proton/shared/lib/helpers/organization';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

import Info from '../../components/link/Info';
import Loader from '../../components/loader/Loader';
import { PermissionBanner, PermissionTooltip } from '../../components/orgPermissions/index';
import Toggle from '../../components/toggle/Toggle';
import useApi from '../../hooks/useApi';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsParagraph from '../account/SettingsParagraph';

interface Props {
    organization?: Organization;
}

const OrganizationTwoFAEnforcementSection = ({ organization }: Props) => {
    const api = useApi();
    const { APP_NAME } = useConfig();
    const [{ permissions }] = useUserPermissions();
    const hasFamilyOrg = getOrganizationDenomination(organization) === 'familyGroup';

    const canSavePolicy =
        permissions?.['account.security_policy.create'] || permissions?.['account.security_policy.update'];
    const canDelete = permissions?.['account.security_policy.delete'];

    const [isTwoFARequiredForAdminOnlyChecked, setIsTwoFARequiredForAdminOnlyChecked] = useState(
        hasTwoFARequiredForAdminOnly(organization)
    );
    const [isTwoFARequiredForAllChecked, setIsTwoFARequiredForAllChecked] = useState(
        hasTwoFARequiredForAll(organization)
    );
    const { createNotification } = useNotifications();

    if (!organization) {
        return <Loader />;
    }

    const handleEnforceTwoFA = async (require: number) => {
        await api(queryEnforceTwoFA(require));
        if (require === ORGANIZATION_TWOFA_SETTING.REQUIRED_ADMIN_ONLY) {
            setIsTwoFARequiredForAdminOnlyChecked(true);
            setIsTwoFARequiredForAllChecked(false);
            createNotification({
                text: c('Notification').t`Two-factor authentication has been enforced for administrators`,
            });
            return;
        }
        setIsTwoFARequiredForAdminOnlyChecked(true);
        setIsTwoFARequiredForAllChecked(true);
        createNotification({
            text: c('Notification').t`Two-factor authentication has been enforced for all members`,
        });
    };

    const handleRemoveTwoFA = async () => {
        await api(queryRemoveTwoFA());
        setIsTwoFARequiredForAdminOnlyChecked(false);
        setIsTwoFARequiredForAllChecked(false);
        createNotification({
            text: c('Notification').t`Two-factor authentication is not required anymore`,
        });
    };

    return (
        <>
            <SettingsParagraph>
                {hasFamilyOrg
                    ? c('Info')
                          .t`We recommend notifying the family members and asking them to set up 2FA for their accounts before enforcing the use of 2FA.`
                    : c('Info')
                          .t`We recommend notifying the organization members and asking them to set up 2FA for their accounts before enforcing the use of 2FA.`}
            </SettingsParagraph>

            <PermissionBanner
                hasPermission={!!canSavePolicy}
                className="mb-4 max-w-custom"
                style={{ '--max-w-custom': '43em' }}
            />
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="two-fa-admin" className="text-semibold flex items-center">
                        <span className="mr-0.5">{c('Label').t`Require 2FA for administrators`}</span>
                        <Info
                            url={
                                APP_NAME === APPS.PROTONVPN_SETTINGS
                                    ? 'https://protonvpn.com/support/require-2fa-organization'
                                    : getKnowledgeBaseUrl('/two-factor-authentication-2fa')
                            }
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <PermissionTooltip
                        hasPermission={
                            isTwoFARequiredForAllChecked ||
                            (isTwoFARequiredForAdminOnlyChecked ? !!canDelete : !!canSavePolicy)
                        }
                    >
                        <Toggle
                            id="two-fa-admin"
                            checked={isTwoFARequiredForAdminOnlyChecked || isTwoFARequiredForAllChecked}
                            disabled={
                                isTwoFARequiredForAllChecked ||
                                (isTwoFARequiredForAdminOnlyChecked ? !canDelete : !canSavePolicy)
                            }
                            onChange={() =>
                                !isTwoFARequiredForAdminOnlyChecked
                                    ? handleEnforceTwoFA(ORGANIZATION_TWOFA_SETTING.REQUIRED_ADMIN_ONLY)
                                    : handleRemoveTwoFA()
                            }
                        />
                    </PermissionTooltip>
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="two-fa-member" className="text-semibold flex items-center">
                        <span className="mr-0.5">{c('Label').t`Require 2FA for everyone`}</span>
                        <Info
                            url={
                                APP_NAME === APPS.PROTONVPN_SETTINGS
                                    ? 'https://protonvpn.com/support/require-2fa-organization'
                                    : getKnowledgeBaseUrl('/two-factor-authentication-2fa')
                            }
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <PermissionTooltip hasPermission={!!canSavePolicy}>
                        <Toggle
                            id="two-fa-member"
                            checked={isTwoFARequiredForAllChecked}
                            disabled={isTwoFARequiredForAllChecked ? !canDelete : !canSavePolicy}
                            onChange={() =>
                                !isTwoFARequiredForAllChecked
                                    ? handleEnforceTwoFA(ORGANIZATION_TWOFA_SETTING.REQUIRED_ALL)
                                    : handleRemoveTwoFA()
                            }
                        />
                    </PermissionTooltip>
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default OrganizationTwoFAEnforcementSection;
