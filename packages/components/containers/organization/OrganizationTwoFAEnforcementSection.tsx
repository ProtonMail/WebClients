import { useState } from 'react';

import { c } from 'ttag';

import { useOrgPermissions } from '@proton/account/userPermissions/hooks';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Info from '@proton/components/components/link/Info';
import Loader from '@proton/components/components/loader/Loader';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import { queryEnforceTwoFA, queryRemoveTwoFA } from '@proton/shared/lib/api/organization';
import { APPS, ORGANIZATION_TWOFA_SETTING } from '@proton/shared/lib/constants';
import { hasTwoFARequiredForAdminOnly, hasTwoFARequiredForAll } from '@proton/shared/lib/helpers/organization';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

interface Props {
    organization?: Organization;
}

const OrganizationTwoFAEnforcementSection = ({ organization }: Props) => {
    const api = useApi();
    const { APP_NAME } = useConfig();
    const [permissions] = useOrgPermissions();
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

            {!canSavePolicy && (
                <Banner variant="norm" noIcon className="mb-4 max-w-custom" style={{ '--max-w-custom': '43em' }}>
                    {c('Info').t`Editing requires permission`}
                </Banner>
            )}
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
                    <Tooltip
                        title={
                            !isTwoFARequiredForAllChecked &&
                            (isTwoFARequiredForAdminOnlyChecked ? !canDelete : !canSavePolicy)
                                ? c('Label').t`You don't have permissions`
                                : undefined
                        }
                    >
                        <span>
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
                        </span>
                    </Tooltip>
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
                    <Tooltip title={!canSavePolicy ? c('Label').t`You don't have permissions` : undefined}>
                        <span>
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
                        </span>
                    </Tooltip>
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default OrganizationTwoFAEnforcementSection;
