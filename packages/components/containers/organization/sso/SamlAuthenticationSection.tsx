import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { SettingsParagraph, SettingsSection } from '../../account';

const SamlAuthenticationSection = () => {
    const configureSaml = () => {
        // TODO: implement
        console.log('Configure SAML');
    };

    return (
        <SettingsSection>
            <SettingsParagraph
                learnMoreUrl={
                    // TODO:
                    getKnowledgeBaseUrl('')
                }
            >
                {
                    // TODO:
                    c('Info')
                        .t`Configure SAML authentication for your organization through an identity provider like Okta, Azure or Onelogin. This will enable SAML for the whole organization.`
                }
            </SettingsParagraph>

            <Button color="norm" onClick={configureSaml}>{c('Action').t`Configure SAML`}</Button>
        </SettingsSection>
    );
};

export default SamlAuthenticationSection;
