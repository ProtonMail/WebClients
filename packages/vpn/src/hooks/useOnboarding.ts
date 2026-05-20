import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import { useDeclarativeLocalState } from '@proton/components/hooks/useDeclarativeLocalState.ts';
import { getIsVpnB2BPlan } from '@proton/payments';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { getIsBusinessOnboarded, setBusinessOnboarded } from '../apis/onboarding';
import type { Onboarding } from '../types/Onboarding';
import { ONBOARDING } from '../types/Onboarding';

const useIsEligibleForOnboarding = () => {
    const [user] = useUser();
    const [organization] = useOrganization();

    return isAdmin(user) && !!organization?.PlanName && getIsVpnB2BPlan(organization.PlanName);
};

const resolveOnboardingStep = async ({ api }: { api: ReturnType<typeof useApi> }): Promise<Onboarding> => {
    const isOnboarded = await getIsBusinessOnboarded({ api });
    return isOnboarded ? ONBOARDING.Onboarded : ONBOARDING.NotOnboarded;
};

const onboardingKey = 'b2b-get-started-step';

export const useOnboarding = () => {
    const isEligibleForOnboarding = useIsEligibleForOnboarding();
    const [step, setStep] = useDeclarativeLocalState<Onboarding>(onboardingKey);
    const api = useApi();
    const location = useLocation();

    const hasPromptParam = new URLSearchParams(location.search).has('prompt');
    const onceHandlerRef = useRef(false);
    useEffect(() => {
        if (step === ONBOARDING.Dismissed) {
            return;
        }
        if (!isEligibleForOnboarding) {
            setStep(ONBOARDING.NotEligible);
            return;
        }

        if (hasPromptParam || onceHandlerRef.current) {
            return;
        }

        onceHandlerRef.current = true;
        resolveOnboardingStep({ api }).then(setStep).catch(noop);
    }, [isEligibleForOnboarding, hasPromptParam, api]);

    const onboarded = () => {
        setStep(ONBOARDING.Onboarded);
        setBusinessOnboarded({ api }).catch(noop);
    };

    const complete = () => {
        setStep(ONBOARDING.Dismissed);
    };

    return [step ?? ONBOARDING.NotEligible, onboarded, complete] as const;
};
