import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Info, InputFieldTwo, Loader, useModalState } from '../../../components';
import { useDomains } from '../../../hooks';
import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    SettingsParagraph,
    SettingsSection,
} from '../../account';
import ConfigureSamlModal from './ConfigureSamlModal';
import DomainVerificationState from './DomainVerificationState';

const SamlAuthenticationSection = () => {
    const [configureSamlModalProps, setConfigureSamlModalOpen, renderConfigureSamlModal] = useModalState();
    const [domains, loadingDomains] = useDomains();

    const configureSaml = () => {
        setConfigureSamlModalOpen(true);
    };

    if (loadingDomains) {
        return <Loader />;
    }

    return (
        <>
            {renderConfigureSamlModal && <ConfigureSamlModal {...configureSamlModalProps} />}
            <SettingsSection>
                <SettingsParagraph
                    learnMoreUrl={
                        // TODO:
                        getKnowledgeBaseUrl('')
                    }
                >
                    {c('Info')
                        .t`Configure SAML authentication for your organization through an identity provider like Okta, Azure or Onelogin. This will enable SAML for the whole organization.`}
                </SettingsParagraph>

                {domains.length > 0 ? (
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label htmlFor="domainName" className="text-semibold align-top">
                                <span className="mr-2">{c('Label').t`Allowed Domain`}</span>
                                <Info
                                    title={c('Tooltip')
                                        .t`Specify the domain which is allowed to authenticate with SAML SSO`}
                                />
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="w-full">
                            <InputFieldTwo
                                id="domainName"
                                value={domains[0].DomainName}
                                readOnly
                                inputContainerClassName="bg-weak rounded w-full"
                                unstyled
                                assistiveText={<DomainVerificationState domain={domains[0]} />}
                            />
                        </SettingsLayoutRight>
                    </SettingsLayout>
                ) : (
                    <Button color="norm" onClick={configureSaml}>{c('Action').t`Configure SAML`}</Button>
                )}
            </SettingsSection>
        </>
    );
};

export default SamlAuthenticationSection;
