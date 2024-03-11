import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { getSAMLStaticInfo } from '@proton/shared/lib/api/samlSSO';
import { PLANS } from '@proton/shared/lib/constants';
import { Domain, SSO } from '@proton/shared/lib/interfaces';
import securityUpsellSvg from '@proton/styles/assets/img/illustrations/security-upsell.svg';

import { Info, InputFieldTwo, Loader, ModalStateProps, useModalState } from '../../../components';
import { useApi, useCustomDomains, useOrganization, useSamlSSO, useUser } from '../../../hooks';
import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    SettingsParagraph,
    SettingsSectionWide,
} from '../../account';
import PromotionBanner from '../../banner/PromotionBanner';
import { SubSettingsSection } from '../../layout';
import { SUBSCRIPTION_STEPS, useSubscriptionModal } from '../../payments';
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
    const [organization] = useOrganization();
    const [user] = useUser();
    const api = useApi();
    const [openSubscriptionModal] = useSubscriptionModal();

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

    if (!customDomains || !ssoConfigs || !samlStaticInfo || !organization) {
        return <Loader />;
    }

    if (organization.PlanName !== PLANS.VPN_BUSINESS) {
        return (
            <SettingsSectionWide>
                <PromotionBanner
                    rounded
                    mode="banner"
                    contentCentered={false}
                    icon={<img src={securityUpsellSvg} alt="" width={40} height={40} />}
                    description={
                        <div>
                            <b>{c('Info').t`Enable single sign-on to keep your organization safe`}</b>
                            <div>
                                {c('Info')
                                    .t`Configure SAML authentication for your organization through an identity provider like Okta, Microsoft Azure, or Google Identity Platform. This will enable SAML for the whole organization.`}{' '}
                                <Href
                                    href="https://protonvpn.com/support/sso"
                                    title={c('Info').t`Lean more about single sign-on`}
                                >{c('Link').t`Learn more`}</Href>
                            </div>
                        </div>
                    }
                    cta={
                        user.canPay && (
                            <Button
                                color="norm"
                                fullWidth
                                onClick={() => {
                                    openSubscriptionModal({
                                        metrics: {
                                            source: 'upsells',
                                        },
                                        step: SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION,
                                        plan: PLANS.VPN_BUSINESS,
                                    });
                                }}
                                title={c('Title').t`Setup dedicated servers by upgrading to Business`}
                            >
                                {c('Action').t`Upgrade to Business`}
                            </Button>
                        )
                    }
                />
            </SettingsSectionWide>
        );
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
