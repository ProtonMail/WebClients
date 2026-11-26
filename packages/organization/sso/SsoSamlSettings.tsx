import { c } from 'ttag';

import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Info from '@proton/components/components/link/Info';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import SubSettingsSection from '@proton/components/containers/layout/SubSettingsSection';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import type { Domain } from '@proton/shared/lib/interfaces/Domain';
import type { SSO } from '@proton/shared/lib/interfaces/SSO';
import { IDP_TYPE } from '@proton/shared/lib/interfaces/SSO';
import clsx from '@proton/utils/clsx';

import ConfigureSamlEdugainModal from './ConfigureSamlEdugainModal';
import ConfigureSamlModal from './ConfigureSamlModal';
import DomainVerificationState from './DomainVerificationState';
import type { IdentityProviderEndpointsContentProps } from './IdentityProviderEndpointsContent';
import { OrganizationIdentityWarningBanner } from './OrganizationIdentityWarningBanner';
import RemoveSSODomain from './RemoveSSODomain';
import SSOInfoForm from './SSOInfoForm';
import SamlSetupEntry from './SamlSetupEntry';
import { getSsoConfigForDomain, useSsoSettings } from './SsoSettingsProvider';
import TestSamlModal from './TestSamlModal';
import type { SsoAppInfo } from './ssoAppInfo';

const ConfigureSamlContent = ({
    ssoAppInfo,
    domain,
    domains,
    ssoConfigs,
    count,
    onAddDomain,
    onRemoveDomain,
    onChangeDomain,
    configureSamlModalProps,
    configureSamlEdugainModalProps,
    setConfigureSamlModalOpen,
    setConfigureSamlEdugainModalOpen,
    renderConfigureSamlModal,
    renderConfigureSamlEdugainModal,
    identityProviderEndpointsContentProps,
}: {
    ssoAppInfo: SsoAppInfo;
    domain: Domain;
    domains: Domain[];
    count: { used: number; total: number };
    ssoConfigs: SSO[];
    onAddDomain?: () => void;
    onRemoveDomain?: () => void;
    onChangeDomain: (domain: Domain) => void;
    configureSamlModalProps: ModalStateProps;
    configureSamlEdugainModalProps: ModalStateProps;
    setConfigureSamlModalOpen: (newValue: boolean) => void;
    setConfigureSamlEdugainModalOpen: (newValue: boolean) => void;
    renderConfigureSamlModal: boolean | undefined;
    renderConfigureSamlEdugainModal: boolean | undefined;
    identityProviderEndpointsContentProps: IdentityProviderEndpointsContentProps;
}) => {
    const [removeSSODomainProps, setRemoveSSODomainOpen, renderRemoveSSODomain] = useModalState();
    const [testSamlConfigurationProps, setTestSamlConfigurationOpen, renderTestSamlConfiguration] = useModalState();

    const ssoConfigForDomain = getSsoConfigForDomain(ssoConfigs, domain);
    const [{ permissions }] = useUserPermissions();

    return (
        <>
            {renderConfigureSamlModal && (
                <ConfigureSamlModal
                    domain={domain}
                    {...configureSamlModalProps}
                    {...identityProviderEndpointsContentProps}
                    ssoAppInfo={ssoAppInfo}
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
                    {(() => {
                        if (domains.length === 1 && !onAddDomain) {
                            return (
                                <InputFieldTwo
                                    id="domainName"
                                    value={domain.DomainName}
                                    readOnly
                                    assistiveText={<DomainVerificationState domain={domain} ssoAppInfo={ssoAppInfo} />}
                                />
                            );
                        }

                        const domainOptions = domains.map((domain) => {
                            return (
                                <Option
                                    value={domain}
                                    title={domain.DomainName}
                                    key={domain.ID}
                                    className="flex gap-2 items-center flex-nowrap"
                                >
                                    <IcGlobe className="shrink-0" />{' '}
                                    <span className="text-ellipsis">{domain.DomainName}</span>
                                </Option>
                            );
                        });
                        const addDomain = c('Action').t`Add domain`;
                        const addDomainKey = 'add-domain';

                        const children = [
                            ...domainOptions,
                            <div key="divider" className="my-2">
                                <hr className="m-0 border-bottom border-weak" />
                            </div>,
                            <Option
                                value={addDomainKey}
                                title={addDomain}
                                key={addDomainKey}
                                disabled={!onAddDomain}
                                className="flex gap-2 items-center justify-space-between flex-nowrap"
                            >
                                <div className="flex gap-2 flex-nowrap items-center">
                                    <IcPlus className="shrink-0" />{' '}
                                    <span className="flex-1 text-ellipsis">{addDomain}</span>
                                </div>
                                <div className="shrink-0 color-hint">
                                    {count.used} / {count.total}
                                </div>
                            </Option>,
                        ];

                        return (
                            <InputFieldTwo
                                as={SelectTwo<Domain | typeof addDomainKey>}
                                id="domainName"
                                value={domain}
                                assistiveText={<DomainVerificationState domain={domain} ssoAppInfo={ssoAppInfo} />}
                                renderSelected={(domain) => {
                                    if (domain === addDomainKey) {
                                        return null;
                                    }
                                    if (domain) {
                                        return domain.DomainName;
                                    }
                                    return null;
                                }}
                                onValue={(domain) => {
                                    if (domain === addDomainKey) {
                                        onAddDomain?.();
                                        return;
                                    }
                                    if (domain) {
                                        onChangeDomain(domain);
                                        return;
                                    }
                                }}
                            >
                                {children}
                            </InputFieldTwo>
                        );
                    })()}
                    {!ssoConfigForDomain && (
                        <>
                            {renderRemoveSSODomain && (
                                <RemoveSSODomain domain={domain} onSuccess={onRemoveDomain} {...removeSSODomainProps} />
                            )}
                            {permissions?.['account.domain.delete'] && (
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
                                        <IcCrossBig alt="" />
                                    </Button>
                                </Tooltip>
                            )}
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
                <SamlSetupEntry
                    onBeginSamlSetup={(idpType) => {
                        if (idpType === IDP_TYPE.EDUGAIN) {
                            setConfigureSamlEdugainModalOpen(true);
                        } else {
                            setConfigureSamlModalOpen(true);
                        }
                    }}
                />
            )}
        </>
    );
};

/** The organization identity warning and the SAML authentication section. Needs `SsoSettingsProvider` above it. */
export const SsoSamlSettings = () => {
    const {
        ssoAppInfo,
        customDomains,
        organization,
        samlSSO,
        permissions,
        setSetupSSODomainModalOpen,
        configureSamlModalProps,
        setConfigureSamlModalOpen,
        renderConfigureSamlModal,
        configureSamlEdugainModalProps,
        setConfigureSamlEdugainModalOpen,
        renderConfigureSamlEdugainModal,
        setPreferredDomainID,
        setSelectedIDPType,
        ssoDomains,
        hasSsoDomain,
        domain,
        canAddSsoDomain,
    } = useSsoSettings();

    return (
        <>
            <SettingsSectionWide>
                <OrganizationIdentityWarningBanner />
            </SettingsSectionWide>

            <SubSettingsSection
                id="saml-authentication"
                title={c('Title').t`SAML authentication`}
                className="container-section-sticky-section"
            >
                <SettingsSectionWide>
                    <SettingsParagraph learnMoreUrl={ssoAppInfo.kbUrl}>
                        {c('Info')
                            .t`Configure SAML authentication for your organization through an identity provider (IdP). This will enable SAML for the whole organization.`}
                    </SettingsParagraph>
                    {hasSsoDomain
                        ? permissions?.['account.sso_config.read'] && (
                              <ConfigureSamlContent
                                  ssoAppInfo={ssoAppInfo}
                                  domain={domain}
                                  domains={ssoDomains}
                                  count={{
                                      used: customDomains.length,
                                      total: Math.max(customDomains.length, organization.MaxDomains),
                                  }}
                                  onAddDomain={
                                      canAddSsoDomain
                                          ? () => {
                                                setSelectedIDPType(null);
                                                setSetupSSODomainModalOpen(true);
                                            }
                                          : undefined
                                  }
                                  onChangeDomain={(domain) => {
                                      setPreferredDomainID(domain.ID);
                                  }}
                                  onRemoveDomain={() => {
                                      setPreferredDomainID(undefined);
                                  }}
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
                                      ssoAppInfo,
                                  }}
                              />
                          )
                        : permissions?.['account.sso_config.create'] && (
                              <SamlSetupEntry
                                  onBeginSamlSetup={(idpType) => {
                                      setSelectedIDPType(idpType);
                                      setSetupSSODomainModalOpen(true);
                                  }}
                              />
                          )}
                </SettingsSectionWide>
            </SubSettingsSection>
        </>
    );
};
