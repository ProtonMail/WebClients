import { useInactiveKeys } from '@proton/account';
import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { FeatureCode, useFeature } from '@proton/features';

import useSearchParamsEffect from '../../hooks/useSearchParamsEffect';
import ReactivateKeysModal from '../keys/reactivateKeys/ReactivateKeysModal';
import RecoverDataBanner from './RecoverDataBanner';
import RecoverDataConfirmModal from './RecoverDataConfirmModal';
import RecoveryScoreBanner from './RecoveryScoreBanner/RecoveryScoreBanner';
import SentinelBanner from './SentinelBanner/SentinelBanner';

export const OverviewSectionV2 = () => {
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

    const [{ isSentinelUser }] = useIsSentinelUser();

    return (
        <div className="flex flex-column gap-8">
            {renderReactivateKeys && (
                <ReactivateKeysModal
                    userKeys={userKeys || []}
                    keyReactivationRequests={keyReactivationRequests}
                    {...reactivateKeyProps}
                />
            )}
            {renderConfirm && <RecoverDataConfirmModal {...confirmProps} />}
            {!!keyReactivationRequests.length && hasDismissedRecoverDataCard?.Value === false && (
                <RecoverDataBanner
                    onReactivate={() => setReactivateKeyModalOpen(true)}
                    onDismiss={() => setDismissConfirmModalOpen(true)}
                />
            )}
            {isSentinelUser ? <SentinelBanner /> : <RecoveryScoreBanner />}
        </div>
    );
};
