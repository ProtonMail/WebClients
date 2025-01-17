import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useProtonDomains } from '@proton/account/protonDomains/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useMailShortDomainPostSubscriptionComposerSpotlight from '@proton/components/hooks/mail/useMailShortDomainPostSubscriptionSpotlight';
import { orderAddress, setupAddress } from '@proton/shared/lib/api/addresses';
import { ADDRESS_TYPE, DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import { type Address, type ApiResponse } from '@proton/shared/lib/interfaces';
import { missingKeysSelfProcess } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import useApi from '../useApi';
import useAuthentication from '../useAuthentication';
import useEventManager from '../useEventManager';

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
    const api = useApi();
    const [user, loadingUser] = useUser();
    const shortDomain = `${user.Name}@pm.me`;
    const [{ premiumDomains }, loadingProtonDomains] = useProtonDomains();
    const getAddresses = useGetAddresses();
    const authentication = useAuthentication();
    const { call } = useEventManager();
    const getUserKeys = useGetUserKeys();
    const composerSpotlight = useMailShortDomainPostSubscriptionComposerSpotlight();
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => user);

    return {
        loadingDependencies: loadingProtonDomains || loadingUser,
        shortDomainAddress: shortDomain,
        hasShortDomain: (addresses: Address[]) =>
            Boolean(addresses?.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM)),
        createShortDomainAddress: async ({ setDefault, replaceAddressSignature }: CreateShortDomainAddress) => {
            const [Domain = ''] = premiumDomains;
            const addresses = await getAddresses();

            // Early return if the address already exists
            if (addresses.some(({ Email }) => Email === shortDomain)) {
                return;
            }

            let nextAddressSignature: string | undefined;
            if (replaceAddressSignature && addresses && addresses.length) {
                const { Email: defaultAddressEmail, Signature: defaultAddressSignature } = addresses[0];
                if (defaultAddressSignature) {
                    nextAddressSignature = defaultAddressSignature.replaceAll(defaultAddressEmail, shortDomain);
                }
            }

            // Create address
            const [{ DisplayName = '', Signature = '' } = {}] = addresses || [];
            const { Address } = await api<ApiResponse & { Address: Address }>(
                setupAddress({
                    Domain,
                    DisplayName: DisplayName || '', // DisplayName can be null
                    Signature: nextAddressSignature ?? Signature ?? '', // Signature can be null
                })
            );
            const userKeys = await getUserKeys();
            await missingKeysSelfProcess({
                api,
                userKeys,
                addresses,
                addressesToGenerate: [Address],
                password: authentication.getPassword(),
                keyGenConfig: KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
                onUpdate: noop,
                keyTransparencyVerify,
            });
            await keyTransparencyCommit(userKeys);

            if (setDefault) {
                // Default address is the first one in the list so we need to reorder the addresses
                await api(orderAddress([Address.ID, ...addresses.map(({ ID }) => ID)]));
            }

            // Call event manager to ensure all the UI is up to date
            await call();

            // Activate short domain composer spotlight
            void composerSpotlight.setActive();

            // Return newly created address
            return Address;
        },
    };
};

export default useShortDomainAddress;
