import { useEffect, useRef, useState } from 'react';

import {
    LightLabellingFeatureModal,
    getShouldOpenReferralModal,
    useModalState,
    useShowLightLabellingFeatureModal,
    useSubscription,
} from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { domIsBusy } from '@proton/shared/lib/busy';
import { OPEN_OFFER_MODAL_EVENT, SECOND } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

interface StartPayload {
    time: number;
}

const getStartModalExpired = (initial: StartPayload, now: StartPayload) => {
    return now.time - initial.time > 20 * SECOND;
};

const AccountStartupModals = () => {
    const [subscription] = useSubscription();
    const onceRef = useRef(false);
    const [initial] = useState(() => {
        return { time: Date.now() };
    });

    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const shouldOpenReferralModal = getShouldOpenReferralModal({
        subscription,
        feature: seenReferralModal.feature,
    });

    const showLightLabellingFeatureModal = useShowLightLabellingFeatureModal();
    const [lightLabellingFeatureModalProps, setLightLabellingFeatureModal, renderLightLabellingFeatureModal] =
        useModalState();

    useEffect(() => {
        if (shouldOpenReferralModal.open) {
            document.dispatchEvent(new CustomEvent(OPEN_OFFER_MODAL_EVENT));
        }
    }, [shouldOpenReferralModal.open]);

    useEffect(() => {
        if (
            onceRef.current ||
            isElectronMail ||
            domIsBusy() ||
            getStartModalExpired(initial, {
                time: Date.now(),
            })
        ) {
            return;
        }

        if (showLightLabellingFeatureModal) {
            onceRef.current = true;
            setLightLabellingFeatureModal(true);
            return;
        }
    }, [showLightLabellingFeatureModal]);

    return (
        <>{renderLightLabellingFeatureModal && <LightLabellingFeatureModal {...lightLabellingFeatureModalProps} />}</>
    );
};

export default AccountStartupModals;
