import { useProtonDomains } from '@proton/account/protonDomains/hooks';

const usePmMeDomain = () => {
    const [{ premiumDomains }, loadingProtonDomains] = useProtonDomains();

    if (loadingProtonDomains) {
        return null;
    }

    // premiumDomains[0] is normally 'pm.me', except on Atlas
    // always returns a string starting with . at this point
    return premiumDomains.length === 1 ? '.' + premiumDomains[0] : '.pm.me';
};

export default usePmMeDomain;
