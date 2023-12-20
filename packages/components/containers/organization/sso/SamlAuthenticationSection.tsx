import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import useSAMLConfigs from '@proton/components/hooks/useSAMLConfigs';
import { Domain, SSO } from '@proton/shared/lib/interfaces';

import { Info, InputFieldTwo, Loader, ModalStateProps, useModalState } from '../../../components';
import { useDomains } from '../../../hooks';
import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    SettingsParagraph,
    SettingsSectionWide,
} from '../../account';
import ConfigureSamlModal from './ConfigureSamlModal';
import DomainVerificationState from './DomainVerificationState';
import SSOInfo from './SSOInfo';
import SetupSSODomainModal from './SetupSSODomainModal';

const ConfigureSamlContent = ({
    domain,
    ssoConfigs,
    configureSamlModalProps,
    setConfigureSamlModalOpen,
    renderConfigureSamlModal,
}: {
    domain: Domain;
    ssoConfigs: SSO[];
    configureSamlModalProps: ModalStateProps;
    setConfigureSamlModalOpen: (newValue: boolean) => void;
    renderConfigureSamlModal: boolean | undefined;
}) => {
    const ssoConfigForDomain = ssoConfigs.find(({ DomainID }) => DomainID === domain.ID);

    return (
        <>
            {renderConfigureSamlModal && <ConfigureSamlModal domain={domain} {...configureSamlModalProps} />}
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="domainName" className="text-semibold align-top">
                        <span className="mr-2">{c('Label').t`Allowed Domain`}</span>
                        <Info
                            title={c('Tooltip').t`Specify the domain which is allowed to authenticate with SAML SSO`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full max-w-custom" style={{ '--max-w-custom': '25rem' }}>
                    <InputFieldTwo
                        id="domainName"
                        value={domain.DomainName}
                        readOnly
                        inputContainerClassName="bg-weak rounded w-full"
                        unstyled
                        assistiveText={<DomainVerificationState domain={domain} />}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            {ssoConfigForDomain ? (
                <SSOInfo
                    domain={domain}
                    sso={ssoConfigForDomain}
                    onImportSamlClick={() => setConfigureSamlModalOpen(true)}
                />
            ) : (
                <Button
                    color="norm"
                    onClick={() => {
                        setConfigureSamlModalOpen(true);
                    }}
                >
                    {c('Action').t`Configure SAML`}
                </Button>
            )}
        </>
    );
};

const SamlAuthenticationSection = () => {
    const [domains, loadingDomains] = useDomains();
    const [ssoConfigs, loadingSSOConfigs] = useSAMLConfigs();

    const [setupSSODomainModalProps, setSetupSSODomainModalOpen, renderSetupSSODomainModal] = useModalState();
    const [configureSamlModalProps, setConfigureSamlModalOpen, renderConfigureSamlModal] = useModalState();

    if (loadingDomains || loadingSSOConfigs) {
        return <Loader />;
    }

    return (
        <>
            {renderSetupSSODomainModal && (
                <SetupSSODomainModal
                    onContinue={() => {
                        setupSSODomainModalProps.onClose();
                        setConfigureSamlModalOpen(true);
                    }}
                    {...setupSSODomainModalProps}
                />
            )}
            <SettingsSectionWide>
                <SettingsParagraph learnMoreUrl="https://protonvpn.com/support/sso">
                    {c('Info')
                        .t`Configure SAML authentication for your organization through an identity provider like Okta, Azure or Onelogin. This will enable SAML for the whole organization.`}
                </SettingsParagraph>

                {domains.length > 0 ? (
                    <ConfigureSamlContent
                        domain={domains[0]}
                        ssoConfigs={ssoConfigs}
                        configureSamlModalProps={configureSamlModalProps}
                        setConfigureSamlModalOpen={setConfigureSamlModalOpen}
                        renderConfigureSamlModal={renderConfigureSamlModal}
                    />
                ) : (
                    <Button
                        color="weak"
                        onClick={() => {
                            setSetupSSODomainModalOpen(true);
                        }}
                    >
                        {c('Action').t`Configure SAML`}
                    </Button>
                )}
            </SettingsSectionWide>
        </>
    );
};

export default SamlAuthenticationSection;
