import React from 'react';
import { c } from 'ttag';

import { useAddresses, useModals, useUser } from '../../../hooks';
import useOAuthPopup, { getOAuthAuthorizationUrl } from '../../../hooks/useOAuthPopup';
import { Icon, PrimaryButton } from '../../../components';

import { SettingsSection, SettingsParagraph } from '../../account';

import ImportMailModal from './modals/ImportMailModal';
import { OAuthProps, OAUTH_PROVIDER } from '../interfaces';
import { G_OAUTH_SCOPE_MAIL, OAUTH_TEST_IDS } from '../constants';

const StartImportSection = () => {
    const [user] = useUser();
    const { createModal } = useModals();
    const [addresses, loadingAddresses] = useAddresses();

    const { triggerOAuthPopup } = useOAuthPopup({
        authorizationUrl: getOAuthAuthorizationUrl({ scope: G_OAUTH_SCOPE_MAIL }),
    });

    const handleClick = () => createModal(<ImportMailModal addresses={addresses} />);

    const handleOAuthClick = () => {
        triggerOAuthPopup(OAUTH_PROVIDER.GOOGLE, (oauthProps: OAuthProps) => {
            createModal(<ImportMailModal addresses={addresses} oauthProps={oauthProps} />);
        });
    };

    return (
        <SettingsSection>
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/import-assistant/">
                {c('Info')
                    .t`Transfer your data safely to Proton. Import Assistant connects to your external email provider and imports your selected messages and folders.`}
            </SettingsParagraph>

            <div>
                {OAUTH_TEST_IDS.includes(user.ID) ? (
                    <PrimaryButton
                        className="inline-flex flex-justify-center flex-align-items-center mt0-5 mr1"
                        onClick={handleOAuthClick}
                        disabled={loadingAddresses}
                    >
                        <Icon name="gmail" className="mr0-5" />
                        {c('Action').t`Continue with Google`}
                    </PrimaryButton>
                ) : (
                    <PrimaryButton
                        className="inline-flex flex-justify-center flex-align-items-center mt0-5"
                        onClick={handleClick}
                        disabled={loadingAddresses}
                    >
                        {c('Action').t`Start import`}
                    </PrimaryButton>
                )}
            </div>
        </SettingsSection>
    );
};

export default StartImportSection;
