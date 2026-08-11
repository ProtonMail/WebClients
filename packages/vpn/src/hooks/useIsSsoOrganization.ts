import { useSamlSSO } from '@proton/account/samlSSO/hooks';

/**
 * Whether the organization signs its members in through SSO, i.e. it has at least one enabled SAML config.
 */
export const useIsSsoOrganization = (): { isSsoOrganization: boolean; isLoading: boolean } => {
    const [samlSSO, isLoading] = useSamlSSO();

    const isSsoOrganization = samlSSO?.configs.some((config) => config.Enabled) ?? false;
    return { isSsoOrganization, isLoading };
};
