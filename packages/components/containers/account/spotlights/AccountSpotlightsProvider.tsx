import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { getUnreadableSubscriptionsReason } from '@proton/payments/core/entitlements/unreadable-subscriptions';

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

type SpotlightStep = 'SetupOrg' | 'UsePass' | 'Done';

const usePassOnBoardingSpotlights = () => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const [entitlements] = useEntitlementChecksForOrgAndUser();
    const canReadSubscriptions = getUnreadableSubscriptionsReason({ user, organization }) === undefined;
    const isPassOnboardingAudience = canReadSubscriptions && entitlements.isPassB2BWithoutMail;

    const { feature, update, loading } = useFeature<SpotlightStep>(FeatureCode.PassOnboardingSpotlights);
    const [step, setStep] = useState<SpotlightStep>();

    useEffect(() => {
        if (loading || !feature?.Value) {
            return;
        }

        setStep(feature.Value);
    }, [loading]);

    const gotToStep = (nextStep: SpotlightStep) => {
        void update(nextStep);
        setStep(nextStep);
    };

    const getIsOpen = (currentStep: SpotlightStep) => {
        return isPassOnboardingAudience && step === currentStep;
    };

    return {
        setupOrgSpotlight: {
            isOpen: getIsOpen('SetupOrg'),
            close: () => {
                if (getIsOpen('SetupOrg')) {
                    gotToStep('UsePass');
                }
            },
        },
        startUsingPassSpotlight: {
            isOpen: getIsOpen('UsePass'),
            close: () => {
                if (getIsOpen('UsePass')) {
                    gotToStep('Done');
                }
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
