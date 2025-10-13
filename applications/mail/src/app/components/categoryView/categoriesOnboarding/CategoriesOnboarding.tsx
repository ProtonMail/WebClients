import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { B2BOnboarding } from './B2BOnboarding';
import { B2COnboarding } from './B2COnboarding';
import { CategoryCard } from './CategoryCard';
import { hasSeeFullDisplay } from './categoriesOnboarding.helpers';
import { AudienceType, B2BOnboardinCategoriesWithCards, B2COnboardinCategoriesWithCards } from './onboardingInterface';

interface Props {
    audience?: AudienceType;
    flagValue: number;
}

export const CategoriesOnboarding = ({ audience, flagValue }: Props) => {
    const { labelID } = useMailSelector(params);

    if (audience === AudienceType.B2B) {
        if (labelID === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) {
            // We don't want to show the onboarding if the user has already seen it
            if (hasSeeFullDisplay(flagValue)) {
                return null;
            }

            return <B2BOnboarding flagValue={flagValue} />;
        } else if (B2BOnboardinCategoriesWithCards.has(labelID)) {
            return <CategoryCard audienceType={AudienceType.B2B} labelID={labelID} flagValue={flagValue} />;
        }
    } else if (audience === AudienceType.B2C) {
        if (labelID === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) {
            // We don't want to show the onboarding if the user has already seen it
            if (hasSeeFullDisplay(flagValue)) {
                return null;
            }

            return <B2COnboarding flagValue={flagValue} />;
        } else if (B2COnboardinCategoriesWithCards.has(labelID)) {
            return <CategoryCard audienceType={AudienceType.B2C} labelID={labelID} flagValue={flagValue} />;
        }
    }

    return null;
};
