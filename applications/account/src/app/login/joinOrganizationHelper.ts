import type { AuthCacheResult, SSOSetupData } from '@proton/components/containers/login/interface';

export const getJoinOrganizationData = (
    ssoSetupData: SSOSetupData | null,
    userData: AuthCacheResult['data']['user']
) => {
    const organizationData = ssoSetupData?.organizationData;
    const organizationIdentityAddress = organizationData?.identity.FingerprintSignatureAddress || '';

    const parsedUnprivatizationData = ssoSetupData?.parsedUnprivatizationData;
    const adminEmail =
        parsedUnprivatizationData?.type === 'gsso'
            ? parsedUnprivatizationData.payload.unprivatizationData.AdminEmail
            : organizationIdentityAddress;

    // Deliberately `||` and not `??`: `Email` is an empty string for a user without addresses yet,
    // in which case it should fall through to the next candidate
    const username =
        ssoSetupData?.unprivatizationContextData.addresses[0]?.Email || userData?.Email || userData?.Name || '';

    return {
        organizationLogoUrl: organizationData?.logo?.url,
        organizationName: organizationData?.organization.Name ?? '',
        adminEmail: adminEmail ?? '',
        passwordPolicies: organizationData?.passwordPolicies ?? [],
        username,
    };
};
