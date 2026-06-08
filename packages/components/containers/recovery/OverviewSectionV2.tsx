import { useInactiveKeys } from '@proton/account';
import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { FeatureCode, useFeature } from '@proton/features';

import useSearchParamsEffect from '../../hooks/useSearchParamsEffect';
import ReactivateKeysModal from '../keys/reactivateKeys/ReactivateKeysModal';
import RecoverDataBanner from './RecoverDataBanner';
import RecoverDataConfirmModal from './RecoverDataConfirmModal';
import RecoveryScoreBannerV1 from './RecoveryScoreBanner/RecoveryScoreBanner';
import RecoveryScoreBannerV2 from './RecoveryScoreBanner/RecoveryScoreBannerV2';
import SentinelBanner from './SentinelBanner/SentinelBanner';
import { useRecoveryScoreBannerVariant } from './useRecoveryScoreBannerVariant';

export const OverviewSectionV2 = () => {
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
    const scoreBannerVariant = useRecoveryScoreBannerVariant();
    const RecoveryScoreBanner = scoreBannerVariant === 'B1' ? RecoveryScoreBannerV1 : RecoveryScoreBannerV2;

    return (
        <div className="flex flex-column gap-8">
            {renderReactivateKeys && (
                <ReactivateKeysModal keyReactivationRequests={keyReactivationRequests} {...reactivateKeyProps} />
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
