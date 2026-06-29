import { useEffect, useRef } from 'react';

import { useMailGlobalModals } from 'proton-mail/containers/globalModals/GlobalModalProvider';
import { ModalType } from 'proton-mail/containers/globalModals/inteface';

import { hasSeeFullDisplay } from './categoriesOnboarding.helpers';
import { AudienceType } from './onboardingInterface';
import { useCategoriesOnboarding } from './useCategoriesOnboarding';

export const CategoriesOnboarding = () => {
    const { notify } = useMailGlobalModals();
    const onboarding = useCategoriesOnboarding();
    const hasTriggeredModalRef = useRef(false);

    useEffect(() => {
        // Only trigger modal once per session
        if (hasTriggeredModalRef.current) {
            return;
        }

        const hasSeenModal = hasSeeFullDisplay(onboarding.flagValue);
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

    return null;
};
