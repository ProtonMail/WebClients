import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { getSAMLStaticInfo } from '@proton/shared/lib/api/samlSSO';
import { Domain, SSO } from '@proton/shared/lib/interfaces';

import { SubSettingsSection } from '../..';
import { Info, InputFieldTwo, Loader, ModalStateProps, useModalState } from '../../../components';
import { useApi, useCustomDomains, useSamlSSO } from '../../../hooks';
import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    SettingsParagraph,
    SettingsSectionWide,
} from '../../account';
import ConfigureSamlModal from './ConfigureSamlModal';
import DomainVerificationState from './DomainVerificationState';
import { IdentityProviderEndpointsContentProps } from './IdentityProviderEndpointsContent';
import RemoveSSODomain from './RemoveSSODomain';
import RemoveSSOSection from './RemoveSSOSection';
import SSOInfoForm from './SSOInfoForm';
import SetupSSODomainModal from './SetupSSODomainModal';

const getSsoConfigForDomain = (ssoConfigs: SSO[], domain: Domain) => {
    return ssoConfigs.find(({ DomainID }) => DomainID === domain.ID);
};

const ConfigureSamlContent = ({
    domain,
    ssoConfigs,
    configureSamlModalProps,
    setConfigureSamlModalOpen,
    renderConfigureSamlModal,
    identityProviderEndpointsContentProps,
}: {
    domain: Domain;
    ssoConfigs: SSO[];
    configureSamlModalProps: ModalStateProps;
    setConfigureSamlModalOpen: (newValue: boolean) => void;
    renderConfigureSamlModal: boolean | undefined;
    identityProviderEndpointsContentProps: IdentityProviderEndpointsContentProps;
}) => {
    const [removeSSODomainProps, setRemoveSSODomainOpen, renderRemoveSSODomain] = useModalState();

    const ssoConfigForDomain = getSsoConfigForDomain(ssoConfigs, domain);

    return (
        <>
            {renderConfigureSamlModal && (
                <ConfigureSamlModal
                    domain={domain}
                    {...configureSamlModalProps}
                    {...identityProviderEndpointsContentProps}
                />
            )}
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="domainName" className="text-semibold flex items-center gap-2">
                        <span>{c('Label').t`Allowed Domain`}</span>
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
                        inputContainerClassName="rounded w-full"
                        unstyled
                        assistiveText={<DomainVerificationState domain={domain} />}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            {ssoConfigForDomain ? (
                <SSOInfoForm
                    domain={domain}
                    sso={ssoConfigForDomain}
                    onImportSamlClick={() => setConfigureSamlModalOpen(true)}
                    {...identityProviderEndpointsContentProps}
                />
            ) : (
                <div className="flex gap-4">
                    <Button
                        color="norm"
                        onClick={() => {
                            setConfigureSamlModalOpen(true);
                        }}
                    >
                        {c('Action').t`Configure SAML`}
                    </Button>

                    {renderRemoveSSODomain && <RemoveSSODomain domain={domain} {...removeSSODomainProps} />}
                    <Button
                        color="danger"
                        shape="outline"
                        onClick={() => {
                            setRemoveSSODomainOpen(true);
                        }}
                    >
                        {c('Action').t`Remove domain`}
                    </Button>
                </div>
            )}
        </>
    );
};

const RemoveSSOSettingsSection = ({ domain, ssoConfigs }: { domain: Domain; ssoConfigs: SSO[] }) => {
    const ssoConfigForDomain = getSsoConfigForDomain(ssoConfigs, domain);

    if (!ssoConfigForDomain) {
        return null;
    }

    return (
        <SubSettingsSection
            id="remove-sso"
            title={c('Title').t`Remove single sign-on`}
            className="container-section-sticky-section"
        >
            <SettingsSectionWide>
                <RemoveSSOSection domain={domain} ssoConfig={ssoConfigForDomain} />
            </SettingsSectionWide>
        </SubSettingsSection>
    );
};

const SsoPage = () => {
    const [customDomains] = useCustomDomains();
    const [ssoConfigs] = useSamlSSO();
    const api = useApi();

    const [setupSSODomainModalProps, setSetupSSODomainModalOpen, renderSetupSSODomainModal] = useModalState();
    const [configureSamlModalProps, setConfigureSamlModalOpen, renderConfigureSamlModal] = useModalState();
    const [samlStaticInfo, setSamlStaticInfo] = useState<IdentityProviderEndpointsContentProps>();

    useEffect(() => {
        const fetchData = async () => {
            const response = await api<{ EntityID: string; CallbackURL: string }>(getSAMLStaticInfo());
            setSamlStaticInfo({
                issuerID: response.EntityID,
                callbackURL: response.CallbackURL,
            });
        };

        void fetchData();
    }, []);

    if (!customDomains || !ssoConfigs || !samlStaticInfo) {
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

            <SubSettingsSection
                id="saml-authentication"
                title={c('Title').t`SAML authentication`}
                beta
                className="container-section-sticky-section"
            >
                <SettingsSectionWide>
                    <SettingsParagraph learnMoreUrl="https://protonvpn.com/support/sso">
                        {c('Info')
                            .t`Configure SAML authentication for your organization through an identity provider (IdP). This will enable SAML for the whole organization.`}
                    </SettingsParagraph>

                    {customDomains.length > 0 ? (
                        <ConfigureSamlContent
                            domain={customDomains[0]}
                            ssoConfigs={ssoConfigs}
                            configureSamlModalProps={configureSamlModalProps}
                            setConfigureSamlModalOpen={setConfigureSamlModalOpen}
                            renderConfigureSamlModal={renderConfigureSamlModal}
                            identityProviderEndpointsContentProps={samlStaticInfo}
                        />
                    ) : (
                        <Button
                            color="norm"
                            onClick={() => {
                                setSetupSSODomainModalOpen(true);
                            }}
                        >
                            {c('Action').t`Configure SAML`}
                        </Button>
                    )}
                </SettingsSectionWide>
            </SubSettingsSection>

            {customDomains.length > 0 && <RemoveSSOSettingsSection domain={customDomains[0]} ssoConfigs={ssoConfigs} />}
        </>
    );
};

export default SsoPage;
