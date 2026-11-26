import { c } from 'ttag';

import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import SubSettingsSection from '@proton/components/containers/layout/SubSettingsSection';
import type { Domain } from '@proton/shared/lib/interfaces/Domain';
import type { SSO } from '@proton/shared/lib/interfaces/SSO';

import AdvancedSsoSettingsSection from './AdvancedSsoSettingsSection';
import RemoveSSOSection from './RemoveSSOSection';
import { getSsoConfigForDomain, useSsoSettings } from './SsoSettingsProvider';
import type { SsoAppInfo } from './ssoAppInfo';

const RemoveSSOSettingsSection = ({
    domain,
    ssoConfigs,
    ssoAppInfo,
}: {
    domain: Domain;
    ssoConfigs: SSO[];
    ssoAppInfo: SsoAppInfo;
}) => {
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
                <RemoveSSOSection domain={domain} ssoConfig={ssoConfigForDomain} ssoAppInfo={ssoAppInfo} />
            </SettingsSectionWide>
        </SubSettingsSection>
    );
};

/** The advanced SSO settings and the removal of SSO. Needs `SsoSettingsProvider` above it. */
export const SsoAdvancedSettings = () => {
    const { ssoAppInfo, samlSSO, permissions, isDisableSsoBackupPasswordEnabled, hasSsoDomain, hasSsoConfig, domain } =
        useSsoSettings();

    return (
        <>
            {isDisableSsoBackupPasswordEnabled && hasSsoConfig && permissions?.['account.sso_config.read'] && (
                <AdvancedSsoSettingsSection />
            )}

            {hasSsoDomain && hasSsoConfig && permissions?.['account.sso_config.delete'] && (
                <RemoveSSOSettingsSection domain={domain} ssoConfigs={samlSSO.configs} ssoAppInfo={ssoAppInfo} />
            )}
        </>
    );
};
