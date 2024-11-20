import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useProtonDomains } from '@proton/account/protonDomains/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import { orderAddress, setupAddress } from '@proton/shared/lib/api/addresses';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import { type Address, type ApiResponse } from '@proton/shared/lib/interfaces';
import { missingKeysSelfProcess } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import useApi from '../useApi';
import useAuthentication from '../useAuthentication';
import useEventManager from '../useEventManager';

const useShortDomainAddress = () => {
    const api = useApi();
    const [user, loadingUser] = useUser();
    const shortDomain = `${user.Name}@pm.me`;
    const [{ premiumDomains }, loadingProtonDomains] = useProtonDomains();
    const getAddresses = useGetAddresses();
    const authentication = useAuthentication();
    const { call } = useEventManager();
    const getUserKeys = useGetUserKeys();
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => user);

    return {
        loadingDependencies: loadingProtonDomains || loadingUser,
        shortDomainAddress: shortDomain,
        createShortDomainAddress: async ({
            setDefault,
            addressSignature,
        }: {
            /** Set short domain as default address after creation */
            setDefault: boolean;
            addressSignature?: string;
        }) => {
            const [Domain = ''] = premiumDomains;
            const addresses = await getAddresses();

            // Early return if the address already exists
            if (addresses.some(({ Email }) => Email === shortDomain)) {
                return;
            }

            // Create address
            const [{ DisplayName = '', Signature = '' } = {}] = addresses || [];
            const { Address } = await api<ApiResponse & { Address: Address }>(
                setupAddress({
                    Domain,
                    DisplayName: DisplayName || '', // DisplayName can be null
                    Signature: addressSignature ?? Signature ?? '', // Signature can be null
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

            // Return newly created address
            return Address;
        },
    };
};

export default useShortDomainAddress;
