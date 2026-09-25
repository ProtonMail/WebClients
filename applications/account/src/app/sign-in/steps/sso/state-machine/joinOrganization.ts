import type { User } from '@proton/shared/lib/interfaces';

import type { SSODataTypes } from '../../../auth/interface';
import { NO_PASSWORD_POLICIES } from '../../../state-machine/accountFlow';

/** Who the member joins as, and the organization shown on the SSO screens. */
export const getJoinOrganization = (ssoData: SSODataTypes | undefined, userData: User | undefined) => {
    const organizationData = ssoData?.organizationData;
    const organizationIdentityAddress = organizationData?.identity.FingerprintSignatureAddress || '';

    // Only a member joining without keys yet carries unprivatization data
    const ssoSetupData = ssoData?.type === 'setup' ? ssoData : null;

    const parsedUnprivatizationData = ssoSetupData?.parsedUnprivatizationData;
    const adminEmail =
        parsedUnprivatizationData?.type === 'gsso'
            ? parsedUnprivatizationData.payload.unprivatizationData.AdminEmail
            : organizationIdentityAddress;

    // Deliberately `||` and not `??`: `Email` is an empty string for a user without addresses yet,
    // in which case it should fall through to the next candidate
    const username =
        ssoSetupData?.unprivatizationContextData.addresses[0]?.Email ||
        (ssoData && 'address' in ssoData ? ssoData.address.Email : '') ||
        userData?.Email ||
        userData?.Name ||
        '';

    return {
        organizationLogoUrl: organizationData?.logo?.url,
        organizationName: organizationData?.organization.Name ?? '',
        adminEmail: adminEmail ?? '',
        passwordPolicies: organizationData?.passwordPolicies ?? NO_PASSWORD_POLICIES,
        username,
    };
};

export type JoinOrganization = ReturnType<typeof getJoinOrganization>;
