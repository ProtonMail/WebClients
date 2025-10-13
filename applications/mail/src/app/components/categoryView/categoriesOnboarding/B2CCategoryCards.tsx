import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { setBit } from '@proton/shared/lib/helpers/bitset';

import { getOnboardingCardCopy, hasSeenCategoryCard } from './categoriesOnboarding.helpers';
import { AudienceType, B2C_CATEGORIES_MAPPING } from './onboardingInterface';

interface Props {
    labelID: string;
    flagValue: number;
}

export const B2CCategoryCards = ({ labelID, flagValue }: Props) => {
    const { update } = useFeature(FeatureCode.CategoryViewB2COnboardingViewFlags);

    // We only want to show the card if the user has not seen it before
    const hasAlreadySeenCard = hasSeenCategoryCard(AudienceType.B2C, labelID, flagValue);
    const categoryDescription = getOnboardingCardCopy(AudienceType.B2C, labelID);

    if (!categoryDescription || hasAlreadySeenCard) {
        return null;
    }

    const handleHide = () => {
        const config = B2C_CATEGORIES_MAPPING[labelID];
        if (!config) {
            return;
        }

        return update(setBit(flagValue, config.flag));
    };

    return (
        <div className="w-fit-content m-4 px-3 py-2 bg-norm rounded shadow flex items-center gap-2 justify-space-between">
            <p className="m-0 text-sm color-weak">{categoryDescription}</p>
            <Button onClick={handleHide} shape="ghost" color="weak" size="tiny" icon>
                <Icon name="cross-big" />
            </Button>
        </div>
    );
};
