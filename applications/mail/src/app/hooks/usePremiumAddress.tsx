import { UnlockModal, useKTVerifier } from '@proton/components';
import {
    useApi,
    useAuthentication,
    useEventManager,
    useGetAddresses,
    useGetUserKeys,
    useModals,
    useProtonDomains,
    useUser,
} from '@proton/components/hooks';
import { setupAddress } from '@proton/shared/lib/api/addresses';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import { missingKeysSelfProcess } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

const usePremiumAddress = () => {
    const [user] = useUser();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const getAddresses = useGetAddresses();
    const [{ premiumDomains }, loadingProtonDomains] = useProtonDomains();
    const getUserKeys = useGetUserKeys();
    const [Domain = ''] = premiumDomains;
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => user);

    const createPremiumAddress = async () => {
        const addresses = await getAddresses();
        const [{ DisplayName = '', Signature = '' } = {}] = addresses || [];
        await new Promise<string>((resolve, reject) => {
            createModal(<UnlockModal onClose={() => reject()} onSuccess={resolve} />);
        });
        const { Address } = await api(
            setupAddress({
                Domain,
                DisplayName: DisplayName || '', // DisplayName can be null
                Signature: Signature || '', // Signature can be null
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
        await call();
        return Address;
    };

    return {
        createPremiumAddress,
        loadingProtonDomains,
    };
};

export default usePremiumAddress;
