import { useState } from 'react';

import { c } from 'ttag';

import { Alert, Info, useApi } from '@proton/components';
import { queryEnforceTwoFA, queryRemoveTwoFA } from '@proton/shared/lib/api/organization';
import { APPS, ORGANIZATION_TWOFA_SETTING } from '@proton/shared/lib/constants';
import { hasTwoFARequiredForAdminOnly, hasTwoFARequiredForAll } from '@proton/shared/lib/helpers/organization';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Organization } from '@proton/shared/lib/interfaces';

import { Label, Loader, Row, Toggle } from '../../components';
import { useConfig, useNotifications } from '../../hooks';
import { SettingsParagraph } from '../account';

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

    // Organization is not setup.
    if (!organization?.HasKeys) {
        return <Alert className="mb-1" type="warning">{c('Info').t`Multi-user support not enabled.`}</Alert>;
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
            <Row>
                <Label>
                    <span className="mr-0.5">{c('Label').t`Require 2FA for administrators`}</span>
                    <span className="hidden md:inline">
                        <Info
                            url={
                                APP_NAME === APPS.PROTONVPN_SETTINGS
                                    ? 'https://protonvpn.com/support/require-2fa-organization'
                                    : getKnowledgeBaseUrl('/two-factor-authentication-2fa')
                            }
                        />
                    </span>
                </Label>
                <div className="flex flex-align-items-center">
                    <Toggle
                        id="two-fa-admin"
                        className="mr-0.5 pt-0.5"
                        checked={isTwoFARequiredForAdminOnlyChecked || isTwoFARequiredForAllChecked}
                        disabled={isTwoFARequiredForAllChecked}
                        onChange={() =>
                            !isTwoFARequiredForAdminOnlyChecked
                                ? handleEnforceTwoFA(ORGANIZATION_TWOFA_SETTING.REQUIRED_ADMIN_ONLY)
                                : handleRemoveTwoFA()
                        }
                    />
                </div>
            </Row>
            <Row>
                <Label>
                    <span className="mr-0.5">{c('Label').t`Require 2FA for everyone`}</span>
                    <span className="hidden md:inline">
                        <Info
                            url={
                                APP_NAME === APPS.PROTONVPN_SETTINGS
                                    ? 'https://protonvpn.com/support/require-2fa-organization'
                                    : getKnowledgeBaseUrl('/two-factor-authentication-2fa')
                            }
                        />
                    </span>
                </Label>
                <div className="flex flex-align-items-center">
                    <Toggle
                        id="two-fa-member"
                        className="mr-0.5 pt-0.5"
                        checked={isTwoFARequiredForAllChecked}
                        onChange={() =>
                            !isTwoFARequiredForAllChecked
                                ? handleEnforceTwoFA(ORGANIZATION_TWOFA_SETTING.REQUIRED_ALL)
                                : handleRemoveTwoFA()
                        }
                    />
                </div>
            </Row>
        </>
    );
};

export default OrganizationTwoFAEnforcementSection;
