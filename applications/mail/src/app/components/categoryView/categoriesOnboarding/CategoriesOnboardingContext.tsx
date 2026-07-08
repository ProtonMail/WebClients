import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { domIsBusy } from '@proton/shared/lib/busy';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { setBit } from '@proton/shared/lib/helpers/bitset';

import { useMailGlobalModals } from 'proton-mail/containers/globalModals/GlobalModalProvider';
import { ModalType } from 'proton-mail/containers/globalModals/inteface';
import { contextTotal, selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { getB2COnboardingStep, hasSeenOnboardingModal } from './categoriesOnboarding.helpers';
import type { CategorizeStepLocation } from './onboardingInterface';
import { CategoriesOnboardingFlags, OnboardingFlow, OnboardingStep } from './onboardingInterface';
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
    const [categorizeStepLocation, setCategorizeStepLocation] = useState<CategorizeStepLocation>(undefined);

    const b2cOnboardingViewFlag = useFeature<number>(FeatureCode.CategoryViewB2COnboardingViewFlags);
    const flagRef = useRef(b2cOnboardingViewFlag);
    flagRef.current = b2cOnboardingViewFlag;

    const labelID = useMailSelector(selectLabelID);
    const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX;

    // The onboarding only happens in inbox, the context total will represent the number of emails in primary or the selected category
    const total = useMailSelector(contextTotal);

    useEffect(() => {
        if (categorizeStepLocation !== undefined || !total) {
            return;
        }
        setCategorizeStepLocation(total > 2 ? 'list' : 'tab');
    }, [categorizeStepLocation, total]);

    useEffect(() => {
        // Only trigger modal once per session and when the user is in the Inbox
        if (hasTriggeredModalRef.current || !isInbox || domIsBusy()) {
            return;
        }

        const hasSeenModal = hasSeenOnboardingModal(onboarding.flagValue);
        if (hasSeenModal || !onboarding.isUserEligible) {
            return;
        }

        if (onboarding.onboardingFlow === OnboardingFlow.B2C) {
            hasTriggeredModalRef.current = true;
            notify({
                type: ModalType.CategoriesViewB2COnboarding,
                value: {
                    flagValue: onboarding.flagValue,
                },
            });
        } else if (onboarding.onboardingFlow === OnboardingFlow.B2B) {
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
        const flagValue = b2cOnboardingViewFlag.feature?.Value;
        if (b2cOnboardingViewFlag.loading || flagValue === undefined) {
            return OnboardingStep.NONE;
        }

        if (onboarding.onboardingFlow === OnboardingFlow.B2B || !onboarding.isUserEligible || !isInbox) {
            return OnboardingStep.NONE;
        }

        return getB2COnboardingStep(flagValue);
    }, [
        isInbox,
        b2cOnboardingViewFlag.feature?.Value,
        b2cOnboardingViewFlag.loading,
        onboarding.onboardingFlow,
        onboarding.isUserEligible,
    ]);

    const handleSkip = useCallback(() => {
        const flagValue = flagRef.current.feature?.Value;
        if (flagValue === undefined) {
            return;
        }

        const updatedFlag =
            flagValue |
            CategoriesOnboardingFlags.INITIAL_MODAL |
            CategoriesOnboardingFlags.SPOTLIGHT_MESSAGE |
            CategoriesOnboardingFlags.SPOTLIGHT_CATEGORIZE |
            CategoriesOnboardingFlags.SPOTLIGHT_CUSTOMIZE;

        void flagRef.current.update(updatedFlag);
    }, []);

    const completeCurrentStep = useCallback(() => {
        const bit = STEP_TO_FLAG[activeStep];
        const flagValue = flagRef.current.feature?.Value;
        if (flagValue === undefined || bit === undefined) {
            return;
        }

        void flagRef.current.update(setBit(flagValue, bit));
    }, [activeStep]);

    const userIsInOnboarding = activeStep !== OnboardingStep.NONE && activeStep !== OnboardingStep.DONE;

    const value = useMemo(
        () => ({
            activeStep,
            userIsInOnboarding,
            handleSkip,
            completeCurrentStep,
            categorizeStepLocation,
        }),
        [activeStep, userIsInOnboarding, handleSkip, completeCurrentStep, categorizeStepLocation]
    );

    return <CategoriesOnboardingContext.Provider value={value}>{children}</CategoriesOnboardingContext.Provider>;
};
