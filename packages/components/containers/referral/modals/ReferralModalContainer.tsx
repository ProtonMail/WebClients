import { useEffect } from 'react';
import {
    FeatureCode,
    getShouldOpenReferralModal,
    ReferralModal,
    useFeature,
    useModalState,
    useSubscription,
} from '@proton/components';

const ReferralModalContainer = () => {
    const [subscription] = useSubscription();
    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const [referralModal, setReferralModal, renderReferralModal] = useModalState();
    const shouldOpenReferralModal = getShouldOpenReferralModal({ subscription, feature: seenReferralModal.feature });

    useEffect(() => {
        if (shouldOpenReferralModal.open) {
            setReferralModal(true);
        }
    }, [shouldOpenReferralModal.open]);

    return <>{renderReferralModal && <ReferralModal {...referralModal} endDate={shouldOpenReferralModal.endDate} />}</>;
};

export default ReferralModalContainer;
