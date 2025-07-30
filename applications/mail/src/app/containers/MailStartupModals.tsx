import { useWelcomeFlags } from '@proton/account';
import { useUser } from '@proton/account/user/hooks';
import { EasySwitchProvider } from '@proton/activation';
import {
    InboxDesktopFreeTrialOnboardingModal,
    StartupModals,
    useCancellationReminderModal,
    useLightLabellingFeatureModal,
    useModalState,
    useTrialEndedModal,
} from '@proton/components';
import type { StartupModal } from '@proton/components';
import useInboxFreeTrial from '@proton/components/containers/desktop/freeTrial/useInboxFreeTrial';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import MailOnboardingModal from '../components/onboarding/modal/MailOnboardingModal';

const useMailOnboardingModal: () => StartupModal = () => {
    const [modal, setModal, renderModal] = useModalState();

    const { welcomeFlags, setDone: setWelcomeFlagsDone } = useWelcomeFlags();
    const onboardingOpen = !welcomeFlags.isDone || welcomeFlags.isReplay;

    return {
        showModal: onboardingOpen && !isElectronMail,
        activateModal: () => setModal(true),
        component: renderModal ? (
            <EasySwitchProvider>
                <MailOnboardingModal
                    onDone={() => {
                        setWelcomeFlagsDone();
                        modal.onClose();
                    }}
                    onExit={modal.onExit}
                    open={modal.open}
                    onClose={modal.onClose}
                    hideDiscoverApps
                />
            </EasySwitchProvider>
        ) : null,
    };
};

const useInboxDesktopFreeTrialOnboardingModal: () => StartupModal = () => {
    const [modal, setModal, renderModal] = useModalState();
    const { firstLogin } = useInboxFreeTrial();
    const [user] = useUser();

    return {
        showModal: !!(firstLogin && isElectronMail && !user.hasPaidMail),
        activateModal: () => setModal(true),
        component: renderModal ? <InboxDesktopFreeTrialOnboardingModal {...modal} /> : null,
    };
};

const useStartupModals: () => StartupModal[] = () => {
    const trialEndedModal = useTrialEndedModal();
    const reminderModal = useCancellationReminderModal();
    const onboardingModal = useMailOnboardingModal();
    const inboxDesktopFreeTrialOnboardingModal = useInboxDesktopFreeTrialOnboardingModal();
    const lightLabellingFeatureModal = useLightLabellingFeatureModal();
    return [
        trialEndedModal,
        reminderModal,
        inboxDesktopFreeTrialOnboardingModal,
        onboardingModal,
        lightLabellingFeatureModal,
    ];
};

const MailStartupModals = () => {
    const modals = useStartupModals();
    return <StartupModals modals={modals} />;
};

export default MailStartupModals;
