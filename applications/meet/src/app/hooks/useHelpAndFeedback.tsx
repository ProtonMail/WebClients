import useModalState from '@proton/components/components/modalTwo/useModalState';
import AuthenticatedBugModal from '@proton/components/containers/support/AuthenticatedBugModal';
import BugModal from '@proton/components/containers/support/BugModal';
import HelpModal from '@proton/components/containers/support/HelpModal';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { APPS } from '@proton/shared/lib/constants';

export const useHelpAndFeedback = () => {
    const isGuest = useMeetSelector(selectIsGuest);
    const [helpModal, setHelpModal, renderHelpModal] = useModalState();
    const [bugReportModal, setBugReportModal, renderBugReportModal] = useModalState();
    const BugReportModal = isGuest ? BugModal : AuthenticatedBugModal;

    const modals = (
        <>
            {renderHelpModal && (
                <HelpModal {...helpModal} APP_NAME={APPS.PROTONMEET} onOpenBugModal={() => setBugReportModal(true)} />
            )}
            {renderBugReportModal && <BugReportModal {...bugReportModal} app={APPS.PROTONMEET} />}
        </>
    );

    return { openHelpAndFeedback: () => setHelpModal(true), modals };
};
