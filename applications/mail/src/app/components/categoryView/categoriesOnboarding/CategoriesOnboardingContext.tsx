import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { setBit } from '@proton/shared/lib/helpers/bitset';

import { useMailGlobalModals } from 'proton-mail/containers/globalModals/GlobalModalProvider';
import { ModalType } from 'proton-mail/containers/globalModals/inteface';

import {
    hasSeenOnboardingModal,
    shouldSeeSpotlightCategorize,
    shouldSeeSpotlightCustomize,
    shouldSeeSpotlightMessage,
} from './categoriesOnboarding.helpers';
import { AudienceType, CategoriesOnboardingFlags, OnboardingStep } from './onboardingInterface';
import { useCategoriesOnboardingEligibility } from './useCategoriesOnboardingEligibility';

interface CategoriesOnboardingContextProps {
    userIsInOnboarding: boolean;
    activeStep: OnboardingStep;
    handleSkip: () => void;
    completeCurrentStep: () => void;
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

    useEffect(() => {
        // Only trigger modal once per session
        if (hasTriggeredModalRef.current) {
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
    }, [onboarding, notify]);

    const activeStep = useMemo(() => {
        if (
            b2cOnboardingViewFlag.loading ||
            !b2cOnboardingViewFlag.feature?.Value ||
            onboarding.audienceType === AudienceType.B2B
        ) {
            return OnboardingStep.NONE;
        }

        const flagValue = b2cOnboardingViewFlag.feature?.Value;
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
            value={{ activeStep, userIsInOnboarding, handleSkip, completeCurrentStep }}
        >
            {children}
        </CategoriesOnboardingContext.Provider>
    );
};
