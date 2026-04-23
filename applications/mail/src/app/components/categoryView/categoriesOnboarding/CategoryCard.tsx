import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { setBit } from '@proton/shared/lib/helpers/bitset';

import { getOnboardingCardCopy, hasSeenCategoryCard } from './categoriesOnboarding.helpers';
import { AudienceType, B2B_CATEGORIES_MAPPING, B2C_CATEGORIES_MAPPING } from './onboardingInterface';

interface Props {
    categoryID: CategoryLabelID;
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

export const CategoryCard = ({ categoryID, flagValue, audienceType }: Props) => {
    const featureCode = FEATURE_CODE_MAP[audienceType];
    const { update } = useFeature(featureCode);

    // We only want to show the card if the user has not seen it before
    const hasAlreadySeenCard = hasSeenCategoryCard(audienceType, categoryID, flagValue);
    const categoryDescription = getOnboardingCardCopy(audienceType, categoryID);

    if (!categoryDescription || hasAlreadySeenCard) {
        return null;
    }

    const handleHide = () => {
        const categoriesMapping = CATEGORIES_MAPPING_MAP[audienceType];
        const config = categoriesMapping[categoryID];
        if (!config) {
            return;
        }

        return update(setBit(flagValue, config.flag));
    };

    return (
        <div className="w-fit-content h-auto shrink-0 m-4 px-3 py-2 bg-norm rounded shadow-norm flex items-center gap-2 justify-space-between">
            <p className="m-0 text-sm color-weak">{categoryDescription}</p>
            <Button onClick={handleHide} shape="ghost" color="weak" size="tiny" icon className="border-none">
                <Icon name="cross-big" alt={c('Action').t`Close`} />
            </Button>
        </div>
    );
};
