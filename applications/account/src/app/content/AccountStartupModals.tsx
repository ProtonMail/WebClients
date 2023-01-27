import { useEffect } from 'react';

import { FeatureCode, getShouldOpenReferralModal, useFeature, useSubscription } from '@proton/components';
import { OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';

const AccountStartupModals = () => {
    const [subscription] = useSubscription();
    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const shouldOpenReferralModal = getShouldOpenReferralModal({ subscription, feature: seenReferralModal.feature });

    useEffect(() => {
        if (shouldOpenReferralModal.open) {
            document.dispatchEvent(new CustomEvent(OPEN_OFFER_MODAL_EVENT));
        }
    }, [shouldOpenReferralModal.open]);

    return null;
};

export default AccountStartupModals;
