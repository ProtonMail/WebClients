import type { Domain, SSO } from '@proton/shared/lib/interfaces';

export const getSSODomainsSet = ({ domains, ssoConfigs }: { domains?: Domain[]; ssoConfigs?: SSO[] }) => {
    const domainsMap = (domains || []).reduce<{ [key: string]: Domain }>((acc, domain) => {
        acc[domain.ID] = domain;
        return acc;
    }, {});
    return (ssoConfigs || []).reduce<Set<string>>((acc, ssoConfig) => {
        const domain = domainsMap[ssoConfig.DomainID];
        if (!domain) {
            return acc;
        }
        acc.add(domain.DomainName.toLowerCase());
        return acc;
    }, new Set<string>());
};
