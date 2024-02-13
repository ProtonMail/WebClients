import { useInactiveKeys } from '@proton/account';
import { reactivateKeysProcess } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

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
import { FeatureCode } from '../features';
import { useKTVerifier } from '../keyTransparency';
import ReactivateKeysModal from '../keys/reactivateKeys/ReactivateKeysModal';
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
    const { call, stop, start } = useEventManager();
    const authentication = useAuthentication();
    const api = useApi();
    const [User] = useUser();
    const [Addresses] = useAddresses();
    const [addressesKeys] = useAddressesKeys();
    const [userKeys] = useUserKeys();

    const keyReactivationRequests = useInactiveKeys();

    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => User);

    const [reactivateKeyProps, setReactivateKeyModalOpen, renderReactivateKeys] = useModalState();
    const [confirmProps, setDismissConfirmModalOpen, renderConfirm] = useModalState();

    const { feature: hasDismissedRecoverDataCard } = useFeature(FeatureCode.DismissedRecoverDataCard);

    useSearchParamsEffect(
        (params) => {
            if (params.get('action') === 'recover-data' && keyReactivationRequests.length) {
                setReactivateKeyModalOpen(true);
                params.delete('action');
                return params;
            }
        },
        [keyReactivationRequests.length]
    );

    return (
        <>
            {renderReactivateKeys && (
                <ReactivateKeysModal
                    userKeys={userKeys || []}
                    keyReactivationRequests={keyReactivationRequests}
                    onProcess={async (keyReactivationRecords, onReactivation) => {
                        if (!userKeys || !Addresses || !addressesKeys) {
                            throw new Error('Missing keys');
                        }
                        try {
                            stop();
                            await reactivateKeysProcess({
                                api,
                                user: User,
                                userKeys,
                                addresses: Addresses,
                                addressesKeys,
                                keyReactivationRecords,
                                keyPassword: authentication.getPassword(),
                                onReactivation,
                                keyTransparencyVerify,
                            });
                            await keyTransparencyCommit(userKeys).catch(noop);
                            return await call();
                        } finally {
                            start();
                        }
                    }}
                    {...reactivateKeyProps}
                />
            )}
            {renderConfirm && <RecoverDataConfirmModal {...confirmProps} />}
            {!!keyReactivationRequests.length && hasDismissedRecoverDataCard?.Value === false && (
                <RecoverDataCard
                    className="mb-8"
                    onReactivate={() => setReactivateKeyModalOpen(true)}
                    onDismiss={() => setDismissConfirmModalOpen(true)}
                />
            )}
            <RecoveryCard ids={ids} />
        </>
    );
};

export default OverviewSection;
