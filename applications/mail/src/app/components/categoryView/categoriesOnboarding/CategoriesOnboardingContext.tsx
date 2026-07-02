import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { setBit } from '@proton/shared/lib/helpers/bitset';

import { useMailGlobalModals } from 'proton-mail/containers/globalModals/GlobalModalProvider';
import { ModalType } from 'proton-mail/containers/globalModals/inteface';
import { selectLabelIDUnreadCount } from 'proton-mail/hooks/mailboxCounter/useMaiboxCounter.selector';
import { selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import {
    hasSeenOnboardingModal,
    shouldSeeInitialModal,
    shouldSeeSpotlightCategorize,
    shouldSeeSpotlightCustomize,
    shouldSeeSpotlightMessage,
} from './categoriesOnboarding.helpers';
import type { CategorizeStepLocation } from './onboardingInterface';
import { AudienceType, CategoriesOnboardingFlags, OnboardingStep } from './onboardingInterface';
import { useCategoriesOnboardingEligibility } from './useCategoriesOnboardingEligibility';

interface CategoriesOnboardingContextProps {
    userIsInOnboarding: boolean;
    activeStep: OnboardingStep;
    handleSkip: () => void;
    completeCurrentStep: () => void;
    categorizeStepLocation: CategorizeStepLocation;
}

export const CategoriesOnboardingContext = createContext<CategoriesOnboardingContextProps | null>(null);

const STEP_TO_FLAG: Partial<Record<OnboardingStep, CategoriesOnboardingFlags>> = {
    [OnboardingStep.MESSAGE]: CategoriesOnboardingFlags.SPOTLIGHT_MESSAGE,
    [OnboardingStep.CATEGORIZE]: CategoriesOnboardingFlags.SPOTLIGHT_CATEGORIZE,
    [OnboardingStep.CUSTOMIZE]: CategoriesOnboardingFlags.SPOTLIGHT_CUSTOMIZE,
};

export const useCategoriesOnboarding = () => {
    const context = useContext(CategoriesOnboardingContext);
    if (!context) {
        throw new Error('useCategoriesOnboarding must be used within a CategoriesOnboardingContext');
    }

    return context;
};

export const CategoriesOnboardingProvider = ({ children }: PropsWithChildren) => {
    const { notify } = useMailGlobalModals();
    const onboarding = useCategoriesOnboardingEligibility();
    const hasTriggeredModalRef = useRef(false);

    const b2cOnboardingViewFlag = useFeature<number>(FeatureCode.CategoryViewB2COnboardingViewFlags);
    const labelID = useMailSelector(selectLabelID);
    const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX;

    const primaryCount = useMailSelector((state) =>
        selectLabelIDUnreadCount(state, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)
    );

    useEffect(() => {
        // Only trigger modal once per session and when the user is in the Inbox
        if (hasTriggeredModalRef.current || !isInbox) {
            return;
        }

        const hasSeenModal = hasSeenOnboardingModal(onboarding.flagValue);
        if (hasSeenModal || !onboarding.isUserEligible) {
            return;
        }

        if (onboarding.audienceType === AudienceType.B2C) {
            hasTriggeredModalRef.current = true;
            notify({
                type: ModalType.CategoriesViewB2COnboarding,
                value: {
                    flagValue: onboarding.flagValue,
                },
            });
        } else if (onboarding.audienceType === AudienceType.B2B) {
            hasTriggeredModalRef.current = true;
            notify({
                type: ModalType.CategoriesViewB2BOnboarding,
                value: {
                    flagValue: onboarding.flagValue,
                },
            });
        }
    }, [onboarding, notify, isInbox]);

    const activeStep = useMemo(() => {
        if (
            b2cOnboardingViewFlag.loading ||
            b2cOnboardingViewFlag.feature?.Value === undefined ||
            onboarding.audienceType === AudienceType.B2B
        ) {
            return OnboardingStep.NONE;
        }

        const flagValue = b2cOnboardingViewFlag.feature?.Value;
        if (shouldSeeInitialModal(flagValue)) {
            return OnboardingStep.INITIAL_MODAL;
        }

        if (shouldSeeSpotlightMessage(flagValue)) {
            return OnboardingStep.MESSAGE;
        }

        if (shouldSeeSpotlightCategorize(flagValue)) {
            return OnboardingStep.CATEGORIZE;
        }

        if (shouldSeeSpotlightCustomize(flagValue)) {
            return OnboardingStep.CUSTOMIZE;
        }

        return OnboardingStep.DONE;
    }, [b2cOnboardingViewFlag, onboarding.audienceType]);

    const categorizeStepLocation: CategorizeStepLocation = useMemo(() => {
        if (primaryCount.loading) {
            return undefined;
        }

        if (primaryCount.count > 2) {
            return 'list';
        }

        return 'tab';
    }, [primaryCount]);

    const handleSkip = () => {
        const flagValue = b2cOnboardingViewFlag.feature?.Value;
        if (!flagValue) {
            return;
        }

        const updatedFlag =
            flagValue |
            CategoriesOnboardingFlags.INITIAL_MODAL |
            CategoriesOnboardingFlags.SPOTLIGHT_MESSAGE |
            CategoriesOnboardingFlags.SPOTLIGHT_CATEGORIZE |
            CategoriesOnboardingFlags.SPOTLIGHT_CUSTOMIZE;

        void b2cOnboardingViewFlag.update(updatedFlag);
    };

    const completeCurrentStep = () => {
        const bit = STEP_TO_FLAG[activeStep];
        const flagValue = b2cOnboardingViewFlag.feature?.Value;
        if (!flagValue || bit === undefined) {
            return;
        }

        void b2cOnboardingViewFlag.update(setBit(flagValue, bit));
    };

    const userIsInOnboarding = activeStep !== OnboardingStep.NONE && activeStep !== OnboardingStep.DONE;
    return (
        <CategoriesOnboardingContext.Provider
            value={{
                activeStep,
                userIsInOnboarding,
                handleSkip,
                completeCurrentStep,
                categorizeStepLocation,
            }}
        >
            {children}
        </CategoriesOnboardingContext.Provider>
    );
};
