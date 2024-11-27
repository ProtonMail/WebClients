import { useState } from 'react';

import { c } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSamlSSO } from '@proton/account/samlSSO/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button, Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import Loader from '@proton/components/components/loader/Loader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import TestSamlModal from '@proton/components/containers/organization/sso/TestSamlModal';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { PLANS } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { planSupportsSSO } from '@proton/shared/lib/helpers/subscription';
import type { Domain, SSO } from '@proton/shared/lib/interfaces';
import { IDP_TYPE } from '@proton/shared/lib/interfaces';
import securityUpsellSvg from '@proton/styles/assets/img/illustrations/security-upsell.svg';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import SubSettingsSection from '../../layout/SubSettingsSection';
import ConfigureSamlEdugainModal from './ConfigureSamlEdugainModal';
import ConfigureSamlModal from './ConfigureSamlModal';
import DomainVerificationState from './DomainVerificationState';
import type { IdentityProviderEndpointsContentProps } from './IdentityProviderEndpointsContent';
import RemoveSSODomain from './RemoveSSODomain';
import RemoveSSOSection from './RemoveSSOSection';
import SSOInfoForm from './SSOInfoForm';
import SetupSSODomainModal from './SetupSSODomainModal';
import TXTRecordModal from './TXTRecordModal';
import SCIMSettingsSection from './scim/SCIMSettingsSection';
import SelectIDPSection from './scim/SelectIDPSection';

const getSsoConfigForDomain = (ssoConfigs: SSO[], domain: Domain) => {
    return ssoConfigs.find(({ DomainID }) => DomainID === domain.ID);
};

const ConfigureSamlContent = ({
    domain,
    ssoConfigs,
    configureSamlModalProps,
    configureSamlEdugainModalProps,
    setConfigureSamlModalOpen,
    setConfigureSamlEdugainModalOpen,
    renderConfigureSamlModal,
    renderConfigureSamlEdugainModal,
    identityProviderEndpointsContentProps,
    isEduGainSSOEnabled,
}: {
    domain: Domain;
    ssoConfigs: SSO[];
    configureSamlModalProps: ModalStateProps;
    configureSamlEdugainModalProps: ModalStateProps;
    setConfigureSamlModalOpen: (newValue: boolean) => void;
    setConfigureSamlEdugainModalOpen: (newValue: boolean) => void;
    renderConfigureSamlModal: boolean | undefined;
    renderConfigureSamlEdugainModal: boolean | undefined;
    identityProviderEndpointsContentProps: IdentityProviderEndpointsContentProps;
    isEduGainSSOEnabled: boolean;
}) => {
    const [removeSSODomainProps, setRemoveSSODomainOpen, renderRemoveSSODomain] = useModalState();
    const [testSamlConfigurationProps, setTestSamlConfigurationOpen, renderTestSamlConfiguration] = useModalState();

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
            {renderConfigureSamlEdugainModal && (
                <ConfigureSamlEdugainModal
                    domain={domain}
                    SSOEntityID={ssoConfigForDomain?.SSOEntityID}
                    ExistingEdugainAffiliations={ssoConfigForDomain?.EdugainAffiliations}
                    {...configureSamlEdugainModalProps}
                />
            )}
            {renderTestSamlConfiguration && <TestSamlModal domain={domain} {...testSamlConfigurationProps} />}
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="domainName" className="text-semibold flex items-center gap-2">
                        <span>{c('Label').t`Allowed Domain`}</span>
                        <Info
                            title={c('Tooltip').t`Specify the domain which is allowed to authenticate with SAML SSO`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight
                    className={clsx('w-full flex flex-nowrap items-start gap-2', !ssoConfigForDomain && 'max-w-custom')}
                    style={{ '--max-w-custom': '25rem' }}
                >
                    <InputFieldTwo
                        id="domainName"
                        value={domain.DomainName}
                        readOnly
                        assistiveText={<DomainVerificationState domain={domain} />}
                    />
                    {!ssoConfigForDomain && (
                        <>
                            {renderRemoveSSODomain && <RemoveSSODomain domain={domain} {...removeSSODomainProps} />}
                            <Tooltip title={c('Action').t`Remove domain`}>
                                <Button
                                    color="danger"
                                    shape="ghost"
                                    title={c('Action').t`Remove domain`}
                                    icon
                                    onClick={() => {
                                        setRemoveSSODomainOpen(true);
                                    }}
                                >
                                    <Icon name="cross-big" alt="" />
                                </Button>
                            </Tooltip>
                        </>
                    )}
                </SettingsLayoutRight>
            </SettingsLayout>
            {ssoConfigForDomain ? (
                <SSOInfoForm
                    domain={domain}
                    sso={ssoConfigForDomain}
                    onImportSaml={() => {
                        if (ssoConfigForDomain.Type === IDP_TYPE.EDUGAIN) {
                            setConfigureSamlEdugainModalOpen(true);
                        } else {
                            setConfigureSamlModalOpen(true);
                        }
                    }}
                    onTestSaml={() => setTestSamlConfigurationOpen(true)}
                    {...identityProviderEndpointsContentProps}
                />
            ) : (
                <>
                    {isEduGainSSOEnabled && (
                        <SelectIDPSection
                            onClick={(IDPType) => {
                                if (IDPType === IDP_TYPE.EDUGAIN) {
                                    setConfigureSamlEdugainModalOpen(true);
                                } else {
                                    setConfigureSamlModalOpen(true);
                                }
                            }}
                        />
                    )}

                    {!isEduGainSSOEnabled && (
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

const SsoPage = ({ app }: { app: APP_NAMES }) => {
    const [customDomains] = useCustomDomains();
    const [samlSSO] = useSamlSSO();
    const [organization] = useOrganization();
    const [user] = useUser();
    const [openSubscriptionModal] = useSubscriptionModal();

    const [setupSSODomainModalProps, setSetupSSODomainModalOpen, renderSetupSSODomainModal] = useModalState();
    const [verifySSODOmainModalProps, setVerifySSODomainModalOpen, renderVerifySSODomainModal] = useModalState();
    const [configureSamlModalProps, setConfigureSamlModalOpen, renderConfigureSamlModal] = useModalState();
    const [configureSamlEdugainModalProps, setConfigureSamlEdugainModalOpen, renderConfigureSamlEdugainModal] =
        useModalState();

    const [selectedIDPType, setSelectedIDPType] = useState<IDP_TYPE>(IDP_TYPE.DEFAULT);

    const isEduGainSSOEnabled = useFlag('EduGainSSO');

    if (!customDomains || !samlSSO || !organization) {
        return <Loader />;
    }

    const ssoDomains = customDomains.filter((domain) => domain.Flags['sso-intent']);

    if (!planSupportsSSO(organization.PlanName)) {
        const upsellPlan = (() => {
            if (app === APPS.PROTONVPN_SETTINGS) {
                return PLANS.VPN_BUSINESS;
            }
            if (app === APPS.PROTONPASS) {
                return PLANS.PASS_BUSINESS;
            }
        })();
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
                                    title={c('Info').t`Learn more about single sign-on`}
                                >{c('Link').t`Learn more`}</Href>
                            </div>
                        </div>
                    }
                    cta={
                        user.canPay && upsellPlan ? (
                            <Button
                                color="norm"
                                fullWidth
                                onClick={() => {
                                    openSubscriptionModal({
                                        metrics: {
                                            source: 'upsells',
                                        },
                                        step: SUBSCRIPTION_STEPS.CHECKOUT,
                                        plan: upsellPlan,
                                    });
                                }}
                                title={c('Title').t`Setup dedicated servers by upgrading to Business`}
                            >
                                {c('Action').t`Upgrade to Business`}
                            </Button>
                        ) : undefined
                    }
                />
            </SettingsSectionWide>
        );
    }

    const hasSsoDomain = ssoDomains.length > 0;
    const hasSsoConfig = samlSSO.configs.length > 0;
    const domain = ssoDomains[0];

    const ssoConfigIsEdugain = samlSSO.configs[0]?.Type === IDP_TYPE.EDUGAIN;

    return (
        <>
            {renderSetupSSODomainModal && (
                <SetupSSODomainModal
                    onContinue={() => {
                        setupSSODomainModalProps.onClose();
                        if (selectedIDPType === IDP_TYPE.EDUGAIN) {
                            setConfigureSamlEdugainModalOpen(true);
                        } else {
                            setConfigureSamlModalOpen(true);
                        }
                    }}
                    {...setupSSODomainModalProps}
                />
            )}
            {renderVerifySSODomainModal && domain && <TXTRecordModal domain={domain} {...verifySSODOmainModalProps} />}

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

                    {hasSsoDomain ? (
                        <ConfigureSamlContent
                            domain={domain}
                            ssoConfigs={samlSSO.configs}
                            configureSamlModalProps={configureSamlModalProps}
                            configureSamlEdugainModalProps={configureSamlEdugainModalProps}
                            setConfigureSamlModalOpen={setConfigureSamlModalOpen}
                            setConfigureSamlEdugainModalOpen={setConfigureSamlEdugainModalOpen}
                            renderConfigureSamlModal={renderConfigureSamlModal}
                            renderConfigureSamlEdugainModal={renderConfigureSamlEdugainModal}
                            identityProviderEndpointsContentProps={{
                                issuerID: samlSSO.staticInfo.EntityID,
                                callbackURL: samlSSO.staticInfo.CallbackURL,
                            }}
                            isEduGainSSOEnabled={isEduGainSSOEnabled}
                        />
                    ) : (
                        <>
                            {isEduGainSSOEnabled && (
                                <SelectIDPSection
                                    onClick={(IDP_TYPE) => {
                                        setSelectedIDPType(IDP_TYPE);
                                        setSetupSSODomainModalOpen(true);
                                    }}
                                />
                            )}

                            {!isEduGainSSOEnabled && (
                                <Button
                                    color="norm"
                                    onClick={() => {
                                        setSetupSSODomainModalOpen(true);
                                    }}
                                >
                                    {c('Action').t`Configure SAML`}
                                </Button>
                            )}
                        </>
                    )}
                </SettingsSectionWide>
            </SubSettingsSection>

            {!ssoConfigIsEdugain && (
                <SCIMSettingsSection
                    domain={domain}
                    hasSsoConfig={hasSsoConfig}
                    scimInfo={samlSSO.scimInfo}
                    onShowVerifyDomain={() => {
                        setVerifySSODomainModalOpen(true);
                    }}
                />
            )}

            {hasSsoDomain && hasSsoConfig && <RemoveSSOSettingsSection domain={domain} ssoConfigs={samlSSO.configs} />}
        </>
    );
};

export default SsoPage;
