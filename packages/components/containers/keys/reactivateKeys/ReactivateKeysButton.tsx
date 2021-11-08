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
    const [Addresses, loadingAddresses] = useAddresses();
    const [userKeys, loadingUserKeys] = useUserKeys();
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys();
    const allKeysToReactivate = getAllKeysReactivationRequests(addressesKeys, User, userKeys);

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
                        addresses: Addresses,
                        keyReactivationRecords,
                        keyPassword: authentication.getPassword(),
                        onReactivation,
                    });
                    return call();
                }}
            />
        );
    };

    return (
        <Button
            {...rest}
            color={color}
            onClick={() => {
                handleReactivateKeys(allKeysToReactivate);
            }}
            disabled={disabled || loadingAddresses || loadingAddressesKeys || loadingUserKeys || !userKeys}
        >
            {children}
        </Button>
    );
};

export default ReactivateKeysButton;
