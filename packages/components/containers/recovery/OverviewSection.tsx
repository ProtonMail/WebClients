import { useInactiveKeys } from '@proton/account';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { FeatureCode, useFeature } from '@proton/features';

import useSearchParamsEffect from '../../hooks/useSearchParamsEffect';
import ReactivateKeysModal from '../keys/reactivateKeys/ReactivateKeysModal';
import RecoverDataCard from './RecoverDataCard';
import RecoverDataConfirmModal from './RecoverDataConfirmModal';
import RecoveryCard from './RecoveryCard';

export const OverviewSection = () => {
    const [userKeys] = useUserKeys();

    const keyReactivationRequests = useInactiveKeys();

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
            <RecoveryCard />
        </>
    );
};
