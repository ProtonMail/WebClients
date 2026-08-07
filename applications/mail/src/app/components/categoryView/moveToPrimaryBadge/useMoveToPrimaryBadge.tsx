import { useVariant } from '@proton/unleash/useVariant';

import { selectShouldShowMoveToPrimaryBadge } from 'proton-mail/store/categories/categoriesSelector';
import { useMailSelector } from 'proton-mail/store/hooks';

export const useMoveToPrimaryBadge = () => {
    const flagVariant = useVariant('CategoryViewVariant');
    const experimentBucket = flagVariant.name === 'RecategorizationButton';

    const shouldShowMoveToPrimaryBadge = useMailSelector(selectShouldShowMoveToPrimaryBadge);

    return shouldShowMoveToPrimaryBadge && experimentBucket;
};
