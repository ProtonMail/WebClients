import { useSsoSettings } from './SsoSettingsProvider';
import SCIMSettingsSection from './scim/SCIMSettingsSection';

/** The SCIM provisioning section. Needs `SsoSettingsProvider` above it. */
export const SsoScimSettings = () => {
    const { ssoAppInfo, samlSSO, permissions, setVerifySSODomainModalOpen, hasSsoConfig, domain } = useSsoSettings();

    return (
        <>
            {permissions?.['account.sso_config.read'] && (
                <SCIMSettingsSection
                    domain={domain}
                    hasSsoConfig={hasSsoConfig}
                    scimInfo={samlSSO.scimInfo}
                    onShowVerifyDomain={() => {
                        setVerifySSODomainModalOpen(true);
                    }}
                    ssoAppInfo={ssoAppInfo}
                />
            )}
        </>
    );
};
