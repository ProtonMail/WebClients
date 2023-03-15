import { reactivateKeysProcess } from '@proton/shared/lib/keys';

import { useModalState } from '../../components';
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
import { useKTVerifier } from '../keyTransparency';
import ReactivateKeysModal from '../keys/reactivateKeys/ReactivateKeysModal';
import { getAllKeysReactivationRequests } from '../keys/reactivateKeys/getAllKeysToReactive';
import RecoverDataCard from './RecoverDataCard';
import RecoverDataConfirmModal from './RecoverDataConfirmModal';
import RecoveryCard from './RecoveryCard';

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
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => User);

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
                            keyTransparencyVerify,
                        });
                        await keyTransparencyCommit(userKeys);
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
