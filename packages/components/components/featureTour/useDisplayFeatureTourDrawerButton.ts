import { fromUnixTime, isBefore } from 'date-fns';

import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';

/**
 * Hook that determines if the feature tour drawer button should be displayed
 * based on a configured spotlight display date
 */
const useDisplayFeatureTourDrawerButton = () => {
    const featureTourExpirationDateFlag = useFeature(FeatureCode.FeatureTourExpirationDate);

    if (!featureTourExpirationDateFlag.feature?.Value) {
        return false;
    }

    const spotlightExpirationDate = fromUnixTime(featureTourExpirationDateFlag.feature.Value);

    return isBefore(new Date(), spotlightExpirationDate);
};

export default useDisplayFeatureTourDrawerButton;
