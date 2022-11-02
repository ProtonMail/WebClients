import { Dispatch, SetStateAction, useEffect, useRef } from 'react';

import {
    FeatureCode,
    MigrationModal,
    RebrandingFeedbackModal,
    ReferralModal,
    getShouldOpenMigrationModal,
    getShouldOpenReferralModal,
    useFeature,
    useModalState,
    useRebrandingFeedback,
    useSubscription,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

interface Props {
    setStartupModalState: Dispatch<SetStateAction<{ hasModal?: boolean; isOpen: boolean }>>;
}

const CalendarStartupModals = ({ setStartupModalState }: Props) => {
    // Migration modal
    const [migrationModal, setMigrationModal, renderMigrationModal] = useModalState();
    const migrationModalLastShownFeature = useFeature<string>(FeatureCode.MigrationModalLastShown);
    const shouldOpenMigrationModal = getShouldOpenMigrationModal(migrationModalLastShownFeature);

    // Referral modal
    const [subscription] = useSubscription();
    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const [referralModal, setReferralModal, renderReferralModal] = useModalState();
    const shouldOpenReferralModal = getShouldOpenReferralModal({ subscription, feature: seenReferralModal.feature });

    const [rebrandingFeedbackModal, setRebrandingFeedbackModal, renderRebrandingFeedbackModal] = useModalState();
    const handleRebrandingFeedbackModalDisplay = useRebrandingFeedback();

    const onCloseWithState = (onClose: () => void) => () => {
        onClose();
        setStartupModalState((state) => ({ ...state, isOpen: false }));
    };

    const onceRef = useRef(false);
    useEffect(() => {
        if (onceRef.current) {
            return;
        }

        const openModal = (setModalOpen: (newValue: boolean) => void) => {
            onceRef.current = true;
            setModalOpen(true);
            setStartupModalState({ hasModal: true, isOpen: true });
        };

        if (shouldOpenMigrationModal) {
            openModal(setMigrationModal);
        } else if (shouldOpenReferralModal.open) {
            openModal(setReferralModal);
        } else if (handleRebrandingFeedbackModalDisplay) {
            openModal(setRebrandingFeedbackModal);
        } else {
            setStartupModalState({ hasModal: false, isOpen: false });
        }
    }, [shouldOpenMigrationModal, shouldOpenReferralModal.open, handleRebrandingFeedbackModalDisplay]);

    return (
        <>
            {renderMigrationModal && <MigrationModal app={APPS.PROTONCALENDAR} {...migrationModal} />}
            {renderReferralModal && (
                <ReferralModal
                    endDate={shouldOpenReferralModal.endDate}
                    {...referralModal}
                    onClose={onCloseWithState(referralModal.onClose)}
                />
            )}
            {renderRebrandingFeedbackModal && (
                <RebrandingFeedbackModal
                    onMount={handleRebrandingFeedbackModalDisplay}
                    {...rebrandingFeedbackModal}
                    onClose={onCloseWithState(rebrandingFeedbackModal.onClose)}
                />
            )}
        </>
    );
};

export default CalendarStartupModals;
