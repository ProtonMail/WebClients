import { useEffect } from 'react';

import { useMailGlobalModals } from 'proton-mail/containers/globalModals/GlobalModalProvider';
import { ModalType } from 'proton-mail/containers/globalModals/inteface';

import { hasSeeFullDisplay } from './categoriesOnboarding.helpers';
import { AudienceType } from './onboardingInterface';
import { useCategoriesOnboarding } from './useCategoriesOnboarding';

export const useB2BCategoriesOnboardingModal = () => {
    const onboarding = useCategoriesOnboarding();
    const { notify } = useMailGlobalModals();

    useEffect(() => {
        if (!onboarding.isUserEligible || onboarding.audienceType === AudienceType.B2C) {
            return;
        }

        const hasSeenModal = hasSeeFullDisplay(onboarding.flagValue);
        if (!hasSeenModal) {
            notify({
                type: ModalType.CategoriesViewB2BOnboarding,
                value: {
                    flagValue: onboarding.flagValue,
                },
            });
        }
    }, [onboarding, notify]);
};
