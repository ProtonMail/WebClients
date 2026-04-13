import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { selectCategoryIDs } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { B2COnboarding } from './B2COnboarding';
import { CategoryCard } from './CategoryCard';
import { hasSeeFullDisplay } from './categoriesOnboarding.helpers';
import { AudienceType, B2BOnboardinCategoriesWithCards, B2COnboardinCategoriesWithCards } from './onboardingInterface';

interface Props {
    audience?: AudienceType;
    flagValue: number;
}

export const CategoriesOnboarding = ({ audience, flagValue }: Props) => {
    const categoryIDs = useMailSelector(selectCategoryIDs);
    const categoryID = categoryIDs.includes(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)
        ? MAILBOX_LABEL_IDS.CATEGORY_DEFAULT
        : categoryIDs[0];

    if (audience === AudienceType.B2B) {
        if (B2BOnboardinCategoriesWithCards.has(categoryID)) {
            return <CategoryCard audienceType={AudienceType.B2B} categoryID={categoryID} flagValue={flagValue} />;
        }
    } else if (audience === AudienceType.B2C) {
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
