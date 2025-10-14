import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { setBit } from '@proton/shared/lib/helpers/bitset';

import { getOnboardingCardCopy, hasSeenCategoryCard } from './categoriesOnboarding.helpers';
import { AudienceType, B2B_CATEGORIES_MAPPING, B2C_CATEGORIES_MAPPING } from './onboardingInterface';

interface Props {
    labelID: string;
    flagValue: number;
    audienceType: AudienceType;
}

const FEATURE_CODE_MAP = {
    [AudienceType.B2C]: FeatureCode.CategoryViewB2COnboardingViewFlags,
    [AudienceType.B2B]: FeatureCode.CategoryViewB2BOnboardingViewFlags,
} as const;

const CATEGORIES_MAPPING_MAP = {
    [AudienceType.B2C]: B2C_CATEGORIES_MAPPING,
    [AudienceType.B2B]: B2B_CATEGORIES_MAPPING,
} as const;

export const CategoryCard = ({ labelID, flagValue, audienceType }: Props) => {
    const featureCode = FEATURE_CODE_MAP[audienceType];
    const { update } = useFeature(featureCode);

    // We only want to show the card if the user has not seen it before
    const hasAlreadySeenCard = hasSeenCategoryCard(audienceType, labelID, flagValue);
    const categoryDescription = getOnboardingCardCopy(audienceType, labelID);

    if (!categoryDescription || hasAlreadySeenCard) {
        return null;
    }

    const handleHide = () => {
        const categoriesMapping = CATEGORIES_MAPPING_MAP[audienceType];
        const config = categoriesMapping[labelID];
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
