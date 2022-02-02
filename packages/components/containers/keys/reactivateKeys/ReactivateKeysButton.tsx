import { c } from 'ttag';
import { reactivateKeysProcess } from '@proton/shared/lib/keys';

import Button, { ButtonProps } from '../../../components/button/Button';
import {
    useAddresses,
    useAddressesKeys,
    useApi,
    useAuthentication,
    useEventManager,
    useModals,
    useSearchParamsEffect,
    useUser,
    useUserKeys,
} from '../../../hooks';
import { getAllKeysReactivationRequests } from './getAllKeysToReactive';
import ReactivateKeysModal from './ReactivateKeysModal';
import { KeyReactivationRequest } from './interface';

interface Props extends Omit<ButtonProps, 'onClick'> {}

const ReactivateKeysButton = ({
    children = c('Action').t`Reactivate keys`,
    color = 'norm',
    disabled,
    ...rest
}: Props) => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const api = useApi();
    const [User] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const [userKeys, loadingUserKeys] = useUserKeys();
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys();
    const allKeysToReactivate = getAllKeysReactivationRequests(addressesKeys, User, userKeys);

    const loading = loadingAddresses || loadingAddressesKeys || loadingUserKeys || !userKeys;

    const handleReactivateKeys = (keyReactivationRequests: KeyReactivationRequest[]) => {
        createModal(
            <ReactivateKeysModal
                userKeys={userKeys}
                keyReactivationRequests={keyReactivationRequests}
                onProcess={async (keyReactivationRecords, onReactivation) => {
                    await reactivateKeysProcess({
                        api,
                        user: User,
                        userKeys,
                        addresses,
                        keyReactivationRecords,
                        keyPassword: authentication.getPassword(),
                        onReactivation,
                    });
                    return call();
                }}
            />
        );
    };

    useSearchParamsEffect(
        (params) => {
            if (!loading && params.get('action') === 'recover-data') {
                handleReactivateKeys(allKeysToReactivate);
                params.delete('action');
                return params;
            }
        },
        [loading]
    );

    return (
        <Button
            {...rest}
            color={color}
            onClick={() => {
                handleReactivateKeys(allKeysToReactivate);
            }}
            disabled={disabled || loading}
        >
            {children}
        </Button>
    );
};

export default ReactivateKeysButton;
