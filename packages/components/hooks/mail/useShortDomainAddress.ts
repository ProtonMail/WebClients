import { addressesThunk } from '@proton/account/addresses';
import { createPremiumAddress } from '@proton/account/addresses/actions';
import { useProtonDomains } from '@proton/account/protonDomains/hooks';
import { useUser } from '@proton/account/user/hooks';
import useMailShortDomainPostSubscriptionComposerSpotlight from '@proton/components/hooks/mail/useMailShortDomainPostSubscriptionSpotlight';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useDispatch } from '@proton/redux-shared-store';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';

type CreateShortDomainAddress = {
    /** Set short domain as default address after creation */
    setDefault: boolean;
    /**
     * Adds signature for the address based on the default address one
     * by reusing the default address onein the signature
     */
    replaceAddressSignature?: boolean;
};

const useShortDomainAddress = () => {
    const [user, loadingUser] = useUser();
    const [{ premiumDomains }, loadingProtonDomains] = useProtonDomains();
    const premiumDomain = premiumDomains[0] || 'pm.me';
    const shortDomain = `${user.Name}@${premiumDomain}`;
    const dispatch = useDispatch();
    const errorHandler = useErrorHandler();
    const composerSpotlight = useMailShortDomainPostSubscriptionComposerSpotlight();

    return {
        loadingDependencies: loadingProtonDomains || loadingUser,
        shortDomainAddress: shortDomain,
        hasShortDomain: (addresses: Address[]) =>
            Boolean(addresses?.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM)),
        createShortDomainAddress: async ({ setDefault, replaceAddressSignature }: CreateShortDomainAddress) => {
            try {
                const addresses = await dispatch(addressesThunk());

                // Early return if the address already exists
                if (addresses.some(({ Email }) => Email === shortDomain)) {
                    return;
                }

                const Address = await dispatch(
                    createPremiumAddress({
                        domain: premiumDomain,
                        setDefault,
                        replaceAddressSignature,
                    })
                );

                // Activate short domain composer spotlight
                void composerSpotlight.setActive();

                // Return newly created address
                return Address;
            } catch (e) {
                errorHandler(e);
                throw e;
            }
        },
    };
};

export default useShortDomainAddress;
