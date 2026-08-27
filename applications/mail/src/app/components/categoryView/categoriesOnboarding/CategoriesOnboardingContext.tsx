import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { CategoriesOnboardingFlags } from '@proton/mail/features/categoriesView/categoriesOnboarding';
import { domIsBusy } from '@proton/shared/lib/busy';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import { useFlag } from '@proton/unleash/useFlag';

import { useMailGlobalModals } from '../../../containers/globalModals/globalModalContext';
import { ModalType } from '../../../containers/globalModals/inteface';
import { contextTotal, selectLabelID } from '../../../store/elements/elementsSelectors';
import { useMailSelector } from '../../../store/hooks';
import {
    getB2COnboardingStep,
    getListSpotlightStep,
    getTabSpotlightStep,
    hasSeenOnboardingModal,
} from './categoriesOnboarding.helpers';
import type { CategorizeStepLocation } from './onboardingInterface';
import { OnboardingFlow, OnboardingStep } from './onboardingInterface';
import { useCategoriesOnboardingEligibility } from './useCategoriesOnboardingEligibility';

interface CategoriesOnboardingContextProps {
    userIsInB2COnboardingFlow: boolean;
    activeStep: OnboardingStep;
    tabSpotlightStep: OnboardingStep | undefined;
    listSpotlightStep: OnboardingStep | undefined;
    handleSkip: () => void;
    completeCurrentStep: () => void;
}

export const CategoriesOnboardingContext = createContext<CategoriesOnboardingContextProps | null>(null);

const STEP_TO_FLAG: Partial<Record<OnboardingStep, CategoriesOnboardingFlags>> = {
    [OnboardingStep.MESSAGE]: CategoriesOnboardingFlags.SPOTLIGHT_MESSAGE,
    [OnboardingStep.CATEGORIZE]: CategoriesOnboardingFlags.SPOTLIGHT_CATEGORIZE,
    [OnboardingStep.CUSTOMIZE]: CategoriesOnboardingFlags.SPOTLIGHT_CUSTOMIZE,
    [OnboardingStep.FREE_USERS_SPOTLIGHT]: CategoriesOnboardingFlags.SPOTLIGHT_FREE_USERS,
};

const B2C_ONBOARDING_STEPS = new Set<OnboardingStep>([
    OnboardingStep.MESSAGE,
    OnboardingStep.CATEGORIZE,
    OnboardingStep.CUSTOMIZE,
]);

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
    const categorizeStepLocationRef = useRef<CategorizeStepLocation>(undefined);

    const b2cOnboardingViewFlag = useFeature<number>(FeatureCode.CategoryViewB2COnboardingViewFlags);
    const flagRef = useRef(b2cOnboardingViewFlag);
    flagRef.current = b2cOnboardingViewFlag;

    const labelID = useMailSelector(selectLabelID);
    const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX;

    // The onboarding only happens in inbox, the context total will represent the number of emails in primary or the selected category
    const total = useMailSelector(contextTotal);

    // Snapshot the location from the first non-zero total; it must not change once decided
    if (categorizeStepLocationRef.current === undefined && total) {
        categorizeStepLocationRef.current = total > 2 ? 'list' : 'tab';
    }

    // Temporary fix to hide the CATEGORIZE onboarding step
    const disableCategorizeStep = useFlag('CategoryOnboardingDisableCategorize');

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

        if (onboarding.onboardingFlow === OnboardingFlow.FREE_PROMPT) {
            return OnboardingStep.FREE_USERS_SPOTLIGHT;
        }

        // Skip CATEGORIZE synchronously so in-flight users are covered immediately,
        // without waiting on the SPOTLIGHT_CATEGORIZE bit to persist above.
        const effectiveFlagValue = disableCategorizeStep
            ? flagValue | CategoriesOnboardingFlags.SPOTLIGHT_CATEGORIZE
            : flagValue;

        return getB2COnboardingStep(effectiveFlagValue);
    }, [
        isInbox,
        disableCategorizeStep,
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

        // Piggyback on this real user action to also mark CATEGORIZE as seen, since the
        // step is hidden and the user will never trigger it themselves.
        let updatedFlag = setBit(flagValue, bit);
        if (disableCategorizeStep) {
            updatedFlag = setBit(updatedFlag, CategoriesOnboardingFlags.SPOTLIGHT_CATEGORIZE);
        }

        void flagRef.current.update(updatedFlag);
    }, [activeStep, disableCategorizeStep]);

    const tabSpotlightStep = getTabSpotlightStep(activeStep, categorizeStepLocationRef.current);
    const listSpotlightStep = getListSpotlightStep(activeStep, categorizeStepLocationRef.current);

    const userIsInB2COnboardingFlow = B2C_ONBOARDING_STEPS.has(activeStep);

    const value: CategoriesOnboardingContextProps = useMemo(
        () => ({
            activeStep,
            tabSpotlightStep,
            listSpotlightStep,
            userIsInB2COnboardingFlow,
            handleSkip,
            completeCurrentStep,
        }),
        [activeStep, tabSpotlightStep, listSpotlightStep, userIsInB2COnboardingFlow, handleSkip, completeCurrentStep]
    );

    return <CategoriesOnboardingContext.Provider value={value}>{children}</CategoriesOnboardingContext.Provider>;
};
