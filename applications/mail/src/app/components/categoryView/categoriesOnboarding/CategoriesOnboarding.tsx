import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { B2BOnboarding } from './B2BOnboarding';
import { B2CCategoryCards } from './B2CCategoryCards';
import { B2COnboarding } from './B2COnboarding';
import { hasSeeFullDisplay } from './categoriesOnboarding.helpers';
import { AudienceType, B2COnboardinCategoriesWithCards } from './onboardingInterface';

interface Props {
    audience?: AudienceType;
    flagValue: number;
}

export const CategoriesOnboarding = ({ audience, flagValue }: Props) => {
    const { labelID } = useMailSelector(params);

    if (audience === AudienceType.B2B) {
        return <B2BOnboarding />;
    } else if (audience === AudienceType.B2C) {
        if (labelID === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) {
            // We don't want to show the onboarding if the user has already seen it
            if (hasSeeFullDisplay(flagValue)) {
                return null;
            }

            return <B2COnboarding flagValue={flagValue} />;
        } else if (B2COnboardinCategoriesWithCards.has(labelID)) {
            return <B2CCategoryCards labelID={labelID} flagValue={flagValue} />;
        }
    }

    return null;
};
