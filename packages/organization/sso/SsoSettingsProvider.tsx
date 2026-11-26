import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useState } from 'react';

import { c } from 'ttag';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useCustomDomains } from '@proton/account/domains/hooks';
import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSamlSSO } from '@proton/account/samlSSO/hooks';
import { useCanUpdateBilling, useUserPermissions } from '@proton/account/userPermissions/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { Loader } from '@proton/atoms/Loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Domain } from '@proton/shared/lib/interfaces/Domain';
import type { SSO } from '@proton/shared/lib/interfaces/SSO';
import { IDP_TYPE } from '@proton/shared/lib/interfaces/SSO';
import { getIsSsoAvailable } from '@proton/shared/lib/payments/plan/helpers';
import securityUpsellSvg from '@proton/styles/assets/img/illustrations/security-upsell.svg';
import { useFlag } from '@proton/unleash/useFlag';

import SetupSSODomainModal from './SetupSSODomainModal';
import TXTRecordModal from './TXTRecordModal';
import { type SsoAppInfo, getSsoAppInfo } from './ssoAppInfo';

export const getSsoConfigForDomain = (ssoConfigs: SSO[], domain: Domain) => {
    return ssoConfigs.find(({ DomainID }) => DomainID === domain.ID);
};

type ModalState = ReturnType<typeof useModalState>;

interface SsoSettingsContextValue {
    ssoAppInfo: SsoAppInfo;
    customDomains: Domain[];
    organization: NonNullable<ReturnType<typeof useOrganization>[0]>;
    samlSSO: NonNullable<ReturnType<typeof useSamlSSO>[0]>;
    permissions: ReturnType<typeof useUserPermissions>[0]['permissions'];
    isDisableSsoBackupPasswordEnabled: boolean;
    setSetupSSODomainModalOpen: ModalState[1];
    setVerifySSODomainModalOpen: ModalState[1];
    configureSamlModalProps: ModalState[0];
    setConfigureSamlModalOpen: ModalState[1];
    renderConfigureSamlModal: ModalState[2];
    configureSamlEdugainModalProps: ModalState[0];
    setConfigureSamlEdugainModalOpen: ModalState[1];
    renderConfigureSamlEdugainModal: ModalState[2];
    setPreferredDomainID: Dispatch<SetStateAction<Domain['ID'] | undefined>>;
    setSelectedIDPType: Dispatch<SetStateAction<IDP_TYPE | null>>;
    ssoDomains: Domain[];
    hasSsoDomain: boolean;
    hasSsoConfig: boolean;
    /** As in the former SsoPage, typed as set but undefined without SSO domains: read it behind `hasSsoDomain`. */
    domain: Domain;
    canAddSsoDomain: boolean | undefined;
}

const SsoSettingsContext = createContext<SsoSettingsContextValue | null>(null);

export const useSsoSettings = () => {
    const value = useContext(SsoSettingsContext);
    if (!value) {
        throw new Error('useSsoSettings must be used within SsoSettingsProvider');
    }
    return value;
};

/**
 * The former SsoPage's state, loading and upsell, unchanged: renders the upsell instead of its children when the
 * organization can't use SSO. The SSO sections below it read the state through `useSsoSettings`.
 */
export const SsoSettingsProvider = ({ app, children }: { app: APP_NAMES; children: ReactNode }) => {
    const [customDomains] = useCustomDomains();
    const [samlSSO] = useSamlSSO();
    const [organization] = useOrganization();
    const [canUpdateBilling] = useCanUpdateBilling();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const [{ permissions }] = useUserPermissions();
    const isSsoForPbsEnabled = useFlag('SsoForPbs');
    const [allSubscriptions] = useAllSubscriptions();
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();
    const isDisableSsoBackupPasswordEnabled = useFlag('DisableSsoBackupPassword');

    const [setupSSODomainModalProps, setSetupSSODomainModalOpen, renderSetupSSODomainModal] = useModalState();
    const [verifySSODOmainModalProps, setVerifySSODomainModalOpen, renderVerifySSODomainModal] = useModalState();
    const [configureSamlModalProps, setConfigureSamlModalOpen, renderConfigureSamlModal] = useModalState();
    const [configureSamlEdugainModalProps, setConfigureSamlEdugainModalOpen, renderConfigureSamlEdugainModal] =
        useModalState();

    const [preferredDomainID, setPreferredDomainID] = useState<Domain['ID'] | undefined>(undefined);
    const [selectedIDPType, setSelectedIDPType] = useState<IDP_TYPE | null>(null);

    if (!customDomains || !samlSSO || !organization || !allSubscriptions || loadingEntitlements) {
        return <Loader />;
    }

    const ssoDomains = customDomains.filter((domain) => domain.Flags['sso-intent']);

    const ssoAppInfo = getSsoAppInfo(app, organization.PlanName);

    if (!getIsSsoAvailable({ hasSso: entitlements.hasSso, subscriptions: allSubscriptions, isSsoForPbsEnabled })) {
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
                                <Href href={ssoAppInfo.kbUrl} title={c('Info').t`Learn more about single sign-on`}>{c(
                                    'Link'
                                ).t`Learn more`}</Href>
                            </div>
                        </div>
                    }
                    cta={
                        canUpdateBilling && ssoAppInfo.upsellPlan ? (
                            <Button
                                color="norm"
                                fullWidth
                                loading={loadingSubscriptionModal}
                                onClick={() => {
                                    void openSubscriptionModal({
                                        step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
                                    });
                                }}
                                title={c('Title').t`Setup dedicated servers by upgrading to Business`}
                            >
                                {c('Action').t`Upgrade`}
                            </Button>
                        ) : undefined
                    }
                />
            </SettingsSectionWide>
        );
    }

    const hasSsoDomain = ssoDomains.length > 0;
    const hasSsoConfig = samlSSO.configs.some((config) => config.Enabled);
    const domain: Domain | undefined = ssoDomains.find(({ ID }) => ID === preferredDomainID) || ssoDomains[0];
    // Domain addons are not currently supported on vpn or pass b2b plans, so ignoring any addon upsell here.
    const canAddSsoDomain = customDomains.length !== organization.MaxDomains && permissions?.['account.domain.create'];

    const value: SsoSettingsContextValue = {
        ssoAppInfo,
        customDomains,
        organization,
        samlSSO,
        permissions,
        isDisableSsoBackupPasswordEnabled,
        setSetupSSODomainModalOpen,
        setVerifySSODomainModalOpen,
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
        hasSsoConfig,
        domain,
        canAddSsoDomain,
    };

    return (
        <SsoSettingsContext.Provider value={value}>
            {renderSetupSSODomainModal && (
                <SetupSSODomainModal
                    onDomainAdded={(domain) => {
                        setPreferredDomainID(domain.ID);
                    }}
                    onContinue={() => {
                        setupSSODomainModalProps.onClose();
                        if (selectedIDPType === null) {
                            return;
                        }
                        if (selectedIDPType === IDP_TYPE.EDUGAIN) {
                            setConfigureSamlEdugainModalOpen(true);
                        } else {
                            setConfigureSamlModalOpen(true);
                        }
                    }}
                    {...setupSSODomainModalProps}
                    onClose={() => {
                        setupSSODomainModalProps.onClose();
                    }}
                    ssoAppInfo={ssoAppInfo}
                />
            )}
            {renderVerifySSODomainModal && domain && (
                <TXTRecordModal domain={domain} ssoAppInfo={ssoAppInfo} {...verifySSODOmainModalProps} />
            )}

            {children}
        </SsoSettingsContext.Provider>
    );
};
