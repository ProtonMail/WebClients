import { addressKeysThunk, addressesThunk, useInactiveKeys, userKeysThunk } from '@proton/account';
import { useUser } from '@proton/account/user/hooks';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useEventManager from '@proton/components/hooks/useEventManager';
import { FeatureCode, useFeature } from '@proton/features';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { reactivateKeysProcess } from '@proton/shared/lib/keys';
import { useFlag } from '@proton/unleash';
import noop from '@proton/utils/noop';

import useSearchParamsEffect from '../../hooks/useSearchParamsEffect';
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

export const OverviewSection = ({ ids }: Props) => {
    const { call, stop, start } = useEventManager();
    const authentication = useAuthentication();
    const api = useApi();
    const [User] = useUser();
    const [userKeys] = useUserKeys();
    const dispatch = useDispatch();

    const keyReactivationRequests = useInactiveKeys();

    const createKTVerifier = useKTVerifier();

    const [reactivateKeyProps, setReactivateKeyModalOpen, renderReactivateKeys] = useModalState();
    const [confirmProps, setDismissConfirmModalOpen, renderConfirm] = useModalState();

    const { feature: hasDismissedRecoverDataCard } = useFeature(FeatureCode.DismissedRecoverDataCard);
    const canDisplayNewSentinelSettings = useFlag('SentinelRecoverySettings');

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
                        try {
                            stop();
                            const [userKeys, addresses] = await Promise.all([
                                dispatch(userKeysThunk()),
                                dispatch(addressesThunk()),
                            ]);
                            const addressesKeys = await Promise.all(
                                addresses.map(async (address) => ({
                                    address,
                                    keys: await dispatch(addressKeysThunk({ addressID: address.ID })),
                                }))
                            );
                            const { keyTransparencyVerify, keyTransparencyCommit } = await createKTVerifier();
                            await reactivateKeysProcess({
                                api,
                                user: User,
                                userKeys,
                                addresses,
                                addressesKeys,
                                keyReactivationRecords,
                                keyPassword: authentication.getPassword(),
                                onReactivation,
                                keyTransparencyVerify,
                            });
                            await keyTransparencyCommit(User, userKeys).catch(noop);
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
            <RecoveryCard ids={ids} canDisplayNewSentinelSettings={canDisplayNewSentinelSettings} />
        </>
    );
};
