import { useProtonDomains } from '@proton/account/protonDomains/hooks';

const usePmMeDomain = (): [string | null, boolean] => {
    const [{ premiumDomains }, loadingProtonDomains] = useProtonDomains();

    if (loadingProtonDomains) {
        return [null, loadingProtonDomains];
    }

    const featureEnabled = false;
    if (!featureEnabled) {
        return [null, loadingProtonDomains];
    }

    // premiumDomains[0] is normally 'pm.me', except on Atlas
    // always returns a string starting with . at this point
    const pmMeDomain = premiumDomains.length === 1 ? '.' + premiumDomains[0] : '.pm.me';
    return [pmMeDomain, loadingProtonDomains];
};

export default usePmMeDomain;
