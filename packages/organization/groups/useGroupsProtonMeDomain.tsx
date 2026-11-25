import { useProtonDomains } from '@proton/account/protonDomains/hooks';

const VALID_GROUP_DOMAIN_SUFFIX_REGEX = new RegExp(`^(proton.me|protonmail.dev|.+\.proton\.black)$`);

const useGroupsProtonMeDomain = (): [string | null, boolean] => {
    const [{ protonDomains }, loadingProtonDomains] = useProtonDomains();

    if (loadingProtonDomains) {
        return [null, loadingProtonDomains];
    }

    const groupDomain = protonDomains.find((domain) => VALID_GROUP_DOMAIN_SUFFIX_REGEX.test(domain));

    if (groupDomain) {
        return ['groups.' + groupDomain, loadingProtonDomains];
    }

    return [null, loadingProtonDomains];
};

export default useGroupsProtonMeDomain;
