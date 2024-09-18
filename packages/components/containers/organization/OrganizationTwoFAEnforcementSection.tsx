import { useState } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/components';
import Info from '@proton/components/components/link/Info';
import Loader from '@proton/components/components/loader/Loader';
import Toggle from '@proton/components/components/toggle/Toggle';
import { queryEnforceTwoFA, queryRemoveTwoFA } from '@proton/shared/lib/api/organization';
import { APPS, ORGANIZATION_TWOFA_SETTING } from '@proton/shared/lib/constants';
import { hasTwoFARequiredForAdminOnly, hasTwoFARequiredForAll } from '@proton/shared/lib/helpers/organization';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';

import { useConfig, useNotifications } from '../../hooks';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight, SettingsParagraph } from '../account';

interface Props {
    organization?: Organization;
}

const OrganizationTwoFAEnforcementSection = ({ organization }: Props) => {
    const api = useApi();
    const { APP_NAME } = useConfig();

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
                {c('Info')
                    .t`We recommend notifying the organization members and asking them to set up 2FA for their accounts before enforcing the use of 2FA.`}
            </SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="two-fa-admin" className="text-semibold">
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
                    <Toggle
                        id="two-fa-admin"
                        checked={isTwoFARequiredForAdminOnlyChecked || isTwoFARequiredForAllChecked}
                        disabled={isTwoFARequiredForAllChecked}
                        onChange={() =>
                            !isTwoFARequiredForAdminOnlyChecked
                                ? handleEnforceTwoFA(ORGANIZATION_TWOFA_SETTING.REQUIRED_ADMIN_ONLY)
                                : handleRemoveTwoFA()
                        }
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="two-fa-member" className="text-semibold">
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
                    <Toggle
                        id="two-fa-member"
                        checked={isTwoFARequiredForAllChecked}
                        onChange={() =>
                            !isTwoFARequiredForAllChecked
                                ? handleEnforceTwoFA(ORGANIZATION_TWOFA_SETTING.REQUIRED_ALL)
                                : handleRemoveTwoFA()
                        }
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default OrganizationTwoFAEnforcementSection;
