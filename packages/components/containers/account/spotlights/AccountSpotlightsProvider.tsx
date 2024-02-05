import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { FeatureCode, useFeature } from '@proton/features';
import { getHasPassB2BPlan } from '@proton/shared/lib/helpers/subscription';

import { useSubscription } from '../../../hooks';

type AccountSpotlightsContextFunctions = {
    passOnboardingSpotlights: {
        setupOrgSpotlight: {
            isOpen: boolean;
            close: () => void;
        };
        startUsingPassSpotlight: {
            isOpen: boolean;
            close: () => void;
        };
    };
};

const AccountSpotlightsContext = createContext<AccountSpotlightsContextFunctions | null>(null);

type SpotlightStep = 'SetupOrg' | 'UsePass' | undefined;

const usePassOnBoardingSpotlights = () => {
    const [subscription] = useSubscription();
    const hasPassB2BPlan = getHasPassB2BPlan(subscription);

    const { feature, update, loading } = useFeature<SpotlightStep>(FeatureCode.PassOnboardingSpotlights);
    const [step, setStep] = useState<SpotlightStep>(undefined);

    useEffect(() => {
        if (loading || feature?.Value === undefined) {
            return;
        }

        setStep(feature.Value);
    }, [loading]);

    const gotToStep = (nextStep: SpotlightStep) => {
        void update(nextStep);
        setStep(nextStep);
    };

    return {
        setupOrgSpotlight: {
            isOpen: hasPassB2BPlan && step === 'SetupOrg',
            close: () => {
                gotToStep('UsePass');
            },
        },
        startUsingPassSpotlight: {
            isOpen: hasPassB2BPlan && step === 'UsePass',
            close: () => {
                gotToStep(undefined);
            },
        },
    };
};

export const AccountSpotlightsProvider = ({ children }: { children: ReactNode }) => {
    const passOnboardingSpotlights = usePassOnBoardingSpotlights();

    const value = {
        passOnboardingSpotlights,
    };

    return <AccountSpotlightsContext.Provider value={value}>{children}</AccountSpotlightsContext.Provider>;
};

export function useAccountSpotlights() {
    const state = useContext(AccountSpotlightsContext);
    if (!state) {
        throw new Error('Trying to use uninitialized AccountSpotlightsProvider');
    }
    return state;
}
