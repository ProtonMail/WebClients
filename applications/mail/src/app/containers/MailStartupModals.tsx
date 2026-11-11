import { useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import EasySwitchProvider from '@proton/activation/src/logic/StoreProvider';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import StartupModals from '@proton/components/components/startupModals/StartupModals';
import {
    useCancellationReminderModal,
    useLightLabellingFeatureModal,
    useNetPromoterScoreModal,
} from '@proton/components/components/startupModals/startupModalHooks';
import type { StartupModal } from '@proton/components/components/startupModals/types';
import { InboxDesktopFreeTrialOnboardingModal } from '@proton/components/containers/desktop/freeTrial/InboxDesktopFreeTrialOnboardingModal';
import useInboxFreeTrial from '@proton/components/containers/desktop/freeTrial/useInboxFreeTrial';
import { NPSApplication } from '@proton/components/containers/netPromoterScore/interface';
import { useTrialEndedModal } from '@proton/payments-ui/containers/subscription/useTrialEndedModal';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import MailOnboardingModal from '../components/onboarding/modal/MailOnboardingModal';
import { PostSignupSurvey } from '../components/postSignupSurvey/PostSignupSurvey';
import { usePostSignupSurveyEligibility } from '../components/postSignupSurvey/usePostSignupSurveyEligibility';

const useMailOnboardingModal: () => StartupModal = () => {
    const [modal, setModal, renderModal] = useModalState();

    const { welcomeFlags, setDone: setWelcomeFlagsDone } = useWelcomeFlags();
    const onboardingOpen = !welcomeFlags.isDone || welcomeFlags.isReplay;
    const isSurveyEligible = usePostSignupSurveyEligibility();
    const [surveyOpen, setSurveyOpen] = useState(false);

    return {
        showModal: onboardingOpen && !isElectronMail,
        activateModal: () => setModal(true),
        component: (
            <>
                {renderModal ? (
                    <EasySwitchProvider>
                        <MailOnboardingModal
                            onDone={() => {
                                // Users in the rollout finish with the survey, they are welcomed once it is closed
                                if (isSurveyEligible) {
                                    setSurveyOpen(true);
                                } else {
                                    setWelcomeFlagsDone();
                                }
                                modal.onClose();
                            }}
                            onExit={modal.onExit}
                            open={modal.open}
                            onClose={modal.onClose}
                            hideDiscoverApps
                        />
                    </EasySwitchProvider>
                ) : null}
                {surveyOpen ? (
                    <PostSignupSurvey
                        onClose={() => {
                            setSurveyOpen(false);
                            setWelcomeFlagsDone();
                        }}
                    />
                ) : null}
            </>
        ),
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
    const netPromoterScoreModal = useNetPromoterScoreModal(
        isElectronMail ? NPSApplication.DesktopMail : NPSApplication.WebMail
    );

    return [
        trialEndedModal,
        reminderModal,
        inboxDesktopFreeTrialOnboardingModal,
        onboardingModal,
        lightLabellingFeatureModal,
        netPromoterScoreModal,
    ];
};

const MailStartupModals = () => {
    const modals = useStartupModals();
    return <StartupModals modals={modals} />;
};

export default MailStartupModals;
