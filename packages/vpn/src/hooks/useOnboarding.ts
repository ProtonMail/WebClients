import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import { useDeclarativeLocalState } from '@proton/components/hooks/useDeclarativeLocalState.ts';
import { getIsVpnB2BPlan } from '@proton/payments';
import { removeItem } from '@proton/shared/lib/helpers/storage';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { Onboarding } from '../../constants/onboarding';
import { getIsBusinessOnboarded, setBusinessOnboarded } from '../apis/onboarding';
import type { OnboardingStep } from '../types/Onboarding';
import { ONBOARDING_STEPS } from '../types/Onboarding';

type Org = { organization?: OrganizationExtended };

const useIsEligibleForOnboarding = ({ organization }: Org) => {
    const [user] = useUser();

    return isAdmin(user) && !!organization?.PlanName && getIsVpnB2BPlan(organization.PlanName);
};

const resolveOnboardingStep = async ({
    api,
    organization,
}: { api: ReturnType<typeof useApi> } & Org): Promise<OnboardingStep> => {
    const isOrgOnboarded = await getIsBusinessOnboarded({ api });
    if (isOrgOnboarded) {
        return ONBOARDING_STEPS.Onboarded;
    }

    const isOrgSetup = organization?.Name || organization?.HasKeys;

    return isOrgSetup ? ONBOARDING_STEPS.Dismissed : ONBOARDING_STEPS.NotOnboarded;
};

export const useOnboarding = () => {
    const [organization] = useOrganization();

    const isEligibleForOnboarding = useIsEligibleForOnboarding({ organization });
    const [step, setStep] = useDeclarativeLocalState<OnboardingStep>(Onboarding.onboardingKey);
    const api = useApi();
    const location = useLocation();

    const hasPromptParam = new URLSearchParams(location.search).has('prompt');
    const onceHandlerRef = useRef(false);

    useEffect(() => {
        onceHandlerRef.current = false;
    }, [organization]);
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
        resolveOnboardingStep({ api, organization }).then(setStep).catch(noop);
    }, [isEligibleForOnboarding, organization, hasPromptParam, api]);

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
