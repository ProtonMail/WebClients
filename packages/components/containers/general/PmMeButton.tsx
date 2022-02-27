import { c } from 'ttag';
import { setupAddress } from '@proton/shared/lib/api/addresses';
import { missingKeysSelfProcess } from '@proton/shared/lib/keys';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '@proton/shared/lib/constants';
import { noop } from '@proton/shared/lib/helpers/function';
import {
    useApi,
    useAddresses,
    useLoading,
    useEventManager,
    useModals,
    useNotifications,
    usePremiumDomains,
    useUser,
    useAuthentication,
    useGetUserKeys,
} from '../../hooks';
import { Button } from '../../components';
import UnlockModal from '../login/UnlockModal';

const PmMeButton = () => {
    const [{ Name }] = useUser();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const [addresses, loadingAddresses] = useAddresses();
    const [premiumDomains, loadingPremiumDomains] = usePremiumDomains();
    const getUserKeys = useGetUserKeys();
    const isLoadingDependencies = loadingAddresses || loadingPremiumDomains;
    const [Domain = ''] = premiumDomains || [];

    const createPremiumAddress = async () => {
        const [{ DisplayName = '', Signature = '' } = {}] = addresses || [];
        await new Promise<void>((resolve, reject) => {
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
            encryptionConfig: ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
            onUpdate: noop,
        });
        await call();
        createNotification({ text: c('Success').t`Premium address created` });
    };

    return (
        <Button
            color="norm"
            disabled={isLoadingDependencies || !Domain}
            loading={loading}
            onClick={() => withLoading(createPremiumAddress())}
        >
            {c('Action').t`Activate ${Name}@pm.me`}
        </Button>
    );
};

export default PmMeButton;
