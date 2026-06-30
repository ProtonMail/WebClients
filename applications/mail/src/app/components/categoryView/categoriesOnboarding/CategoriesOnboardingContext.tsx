import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useRef } from 'react';

import { useMailGlobalModals } from 'proton-mail/containers/globalModals/GlobalModalProvider';
import { ModalType } from 'proton-mail/containers/globalModals/inteface';

import { hasSeenOnboardingModal } from './categoriesOnboarding.helpers';
import { AudienceType } from './onboardingInterface';
import { useCategoriesOnboardingEligibility } from './useCategoriesOnboardingEligibility';

interface CategoriesOnboardingContextProps {}

export const CategoriesOnboardingContext = createContext<CategoriesOnboardingContextProps | null>(null);

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
                type: ModalType.CategoriesViewB2COnboarding,
                value: {
                    flagValue: onboarding.flagValue,
                },
            });
        }
    }, [onboarding, notify]);

    return <CategoriesOnboardingContext.Provider value={null}>{children}</CategoriesOnboardingContext.Provider>;
};
