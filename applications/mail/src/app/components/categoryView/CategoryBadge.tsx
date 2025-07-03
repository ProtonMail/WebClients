import { Badge, useTheme } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { categoryBadgeMapping } from './categoryViewConstants';
import { isLabelIDCaregoryKey } from './categoryViewHelpers';
import { useCategoryViewExperiment } from './useCategoryViewExperiment';

import './CategoryBadge.scss';

interface Props {
    labelIDs?: string[];
    className?: string;
}

export const CategoryBadge = ({ labelIDs, className }: Props) => {
    const theme = useTheme();
    const { canSeeCategoryLabel } = useCategoryViewExperiment();

    if (!labelIDs || !canSeeCategoryLabel) {
        return null;
    }

    // find if one of the labelID is a category key
    const labelID = labelIDs.find((labelID) => isLabelIDCaregoryKey(labelID));
    if (!labelID) {
        return null;
    }

    const data = categoryBadgeMapping[labelID];
    return data ? (
        <Badge
            className={clsx(
                'text-semibold w-fit-content shrink-0',
                theme.information.dark ? data.darkClassName : data.className,
                className
            )}
        >
            {data.label}
        </Badge>
    ) : null;
};
