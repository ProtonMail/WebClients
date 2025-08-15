import { useInactiveKeys } from '@proton/account';
import { reactivateKeysThunk } from '@proton/account/addressKeys/reactivateKeysActions';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { FeatureCode, useFeature } from '@proton/features';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { useFlag } from '@proton/unleash';

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
    const handleError = useErrorHandler();
    const [userKeys] = useUserKeys();
    const dispatch = useDispatch();

    const keyReactivationRequests = useInactiveKeys();

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
                        await dispatch(
                            reactivateKeysThunk({
                                keyReactivationRecords,
                                onReactivation,
                            })
                        ).catch(handleError);
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
