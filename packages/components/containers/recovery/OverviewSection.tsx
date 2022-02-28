import { reactivateKeysProcess } from '@proton/shared/lib/keys';
import {
    useAddresses,
    useAddressesKeys,
    useApi,
    useAuthentication,
    useEventManager,
    useFeature,
    useSearchParamsEffect,
    useUser,
    useUserKeys,
} from '../../hooks';
import { FeatureCode } from '../features/FeaturesContext';
import RecoverDataConfirmModal from './RecoverDataConfirmModal';
import RecoverDataCard from './RecoverDataCard';
import RecoveryCard from './RecoveryCard';
import { getAllKeysReactivationRequests } from '../keys/reactivateKeys/getAllKeysToReactive';
import { useModalState } from '../../components';
import ReactivateKeysModal from '../keys/reactivateKeys/ReactivateKeysModal';

interface Props {
    ids: {
        account: string;
        data: string;
    };
}

const OverviewSection = ({ ids }: Props) => {
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const api = useApi();
    const [User] = useUser();
    const [Addresses] = useAddresses();
    const [userKeys] = useUserKeys();
    const [addressesKeys] = useAddressesKeys();
    const allKeysToReactivate = getAllKeysReactivationRequests(addressesKeys, User, userKeys);

    const [reactivateKeyProps, setReactivateKeyModalOpen, renderReactivateKeys] = useModalState();
    const [confirmProps, setDismissConfirmModalOpen, renderConfirm] = useModalState();

    const { feature: hasDismissedRecoverDataCard } = useFeature(FeatureCode.DismissedRecoverDataCard);

    useSearchParamsEffect(
        (params) => {
            if (params.get('action') === 'recover-data' && allKeysToReactivate.length) {
                setReactivateKeyModalOpen(true);
                params.delete('action');
                return params;
            }
        },
        [allKeysToReactivate]
    );

    return (
        <>
            {renderReactivateKeys && (
                <ReactivateKeysModal
                    userKeys={userKeys}
                    keyReactivationRequests={allKeysToReactivate}
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
                    {...reactivateKeyProps}
                />
            )}
            {renderConfirm && <RecoverDataConfirmModal {...confirmProps} />}
            {!!allKeysToReactivate.length && hasDismissedRecoverDataCard?.Value === false && (
                <RecoverDataCard
                    className="mb2"
                    onReactivate={() => setReactivateKeyModalOpen(true)}
                    onDismiss={() => setDismissConfirmModalOpen(true)}
                />
            )}
            <RecoveryCard ids={ids} />
        </>
    );
};

export default OverviewSection;
