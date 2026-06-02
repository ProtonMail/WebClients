import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import { useDeclarativeLocalState } from '@proton/components/hooks/useDeclarativeLocalState.ts';
import { getIsVpnB2BPlan } from '@proton/payments';
import { removeItem } from '@proton/shared/lib/helpers/storage';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { Onboarding } from '../../constants/onboarding';
import { getIsBusinessOnboarded, setBusinessOnboarded } from '../apis/onboarding';
import type { OnboardingStep } from '../types/Onboarding';
import { ONBOARDING_STEPS } from '../types/Onboarding';

const useIsEligibleForOnboarding = () => {
    const [user] = useUser();
    const [organization] = useOrganization();

    return isAdmin(user) && !!organization?.PlanName && getIsVpnB2BPlan(organization.PlanName);
};

const resolveOnboardingStep = async ({ api }: { api: ReturnType<typeof useApi> }): Promise<OnboardingStep> => {
    const isOnboarded = await getIsBusinessOnboarded({ api });
    return isOnboarded ? ONBOARDING_STEPS.Onboarded : ONBOARDING_STEPS.NotOnboarded;
};

export const useOnboarding = () => {
    const isEligibleForOnboarding = useIsEligibleForOnboarding();
    const [step, setStep] = useDeclarativeLocalState<OnboardingStep>(Onboarding.onboardingKey);
    const api = useApi();
    const location = useLocation();

    const hasPromptParam = new URLSearchParams(location.search).has('prompt');
    const onceHandlerRef = useRef(false);
    useEffect(() => {
        if (step === ONBOARDING_STEPS.Dismissed) {
            return;
        }
        if (!isEligibleForOnboarding) {
            setStep(ONBOARDING_STEPS.NotEligible);
            return;
        }

        if (hasPromptParam || onceHandlerRef.current) {
            return;
        }

        onceHandlerRef.current = true;
        resolveOnboardingStep({ api }).then(setStep).catch(noop);
    }, [isEligibleForOnboarding, hasPromptParam, api]);

    const onboarded = () => {
        setStep(ONBOARDING_STEPS.Onboarded);
        setBusinessOnboarded({ api }).catch(noop);
    };

    const complete = () => {
        removeItem(Onboarding.quickActionsKey);
        setStep(ONBOARDING_STEPS.Dismissed);
    };

    return [step ?? ONBOARDING_STEPS.NotEligible, onboarded, complete] as const;
};
