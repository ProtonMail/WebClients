import { useEffect, useRef } from 'react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useMailGlobalModals } from 'proton-mail/containers/globalModals/GlobalModalProvider';
import { ModalType } from 'proton-mail/containers/globalModals/inteface';
import { selectCategoryIDs } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { B2COnboarding } from './B2COnboarding';
import { CategoryCard } from './CategoryCard';
import { hasSeeFullDisplay } from './categoriesOnboarding.helpers';
import { AudienceType, B2BOnboardinCategoriesWithCards, B2COnboardinCategoriesWithCards } from './onboardingInterface';
import { useCategoriesOnboarding } from './useCategoriesOnboarding';

export const CategoriesOnboarding = () => {
    const onboarding = useCategoriesOnboarding();
    const { notify } = useMailGlobalModals();
    const hasTriggeredModalRef = useRef(false);

    const categoryIDs = useMailSelector(selectCategoryIDs);
    const categoryID = categoryIDs.includes(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)
        ? MAILBOX_LABEL_IDS.CATEGORY_DEFAULT
        : categoryIDs[0];

    useEffect(() => {
        // Only trigger modal once per session
        if (hasTriggeredModalRef.current) {
            return;
        }

        if (!onboarding.isUserEligible || onboarding.audienceType === AudienceType.B2C) {
            return;
        }

        const hasSeenModal = hasSeeFullDisplay(onboarding.flagValue);
        if (!hasSeenModal) {
            hasTriggeredModalRef.current = true;
            notify({
                type: ModalType.CategoriesViewB2BOnboarding,
                value: {
                    flagValue: onboarding.flagValue,
                },
            });
        }
    }, [onboarding, notify]);

    if (!onboarding.isUserEligible) {
        return null;
    }

    const { audienceType, flagValue } = onboarding;

    if (audienceType === AudienceType.B2B) {
        if (B2BOnboardinCategoriesWithCards.has(categoryID)) {
            return <CategoryCard audienceType={AudienceType.B2B} categoryID={categoryID} flagValue={flagValue} />;
        }
    } else if (audienceType === AudienceType.B2C) {
        if (categoryID === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) {
            // We don't want to show the onboarding if the user has already seen it
            if (hasSeeFullDisplay(flagValue)) {
                return null;
            }

            return <B2COnboarding flagValue={flagValue} />;
        } else if (B2COnboardinCategoriesWithCards.has(categoryID)) {
            return <CategoryCard audienceType={AudienceType.B2C} categoryID={categoryID} flagValue={flagValue} />;
        }
    }

    return null;
};
