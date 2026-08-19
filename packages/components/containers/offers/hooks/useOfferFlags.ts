import { FeatureCode, useFeature } from '@proton/features';
import { hasBit, setBit } from '@proton/shared/lib/helpers/bitset';

import type { OfferConfig, OfferGlobalFeatureCodeValue } from '../interface';
import { OfferUserFeatureCodeValue } from '../interface';

const { Default, Visited, Hide, ReplayConsumed } = OfferUserFeatureCodeValue;

const useOfferFlags = (config: OfferConfig) => {
    const { feature: globalFlag, loading: globalFlagLoading } = useFeature<OfferGlobalFeatureCodeValue>(
        FeatureCode.Offers
    );
    const {
        feature: userFlag,
        loading: userFlagLoading,
        update: userFlagUpdate,
    } = useFeature<OfferUserFeatureCodeValue>(config.featureCode);

    const userFlagValue = userFlag?.Value || Default;

    const setBits = (mask: number) => {
        const nextValue = setBit(userFlagValue, mask);
        if (nextValue === userFlagValue) {
            return;
        }

        return userFlagUpdate(nextValue);
    };

    return {
        loading: globalFlagLoading || userFlagLoading,
        isActive: globalFlag?.Value?.[config.ID] === true && !hasBit(userFlagValue, Hide),
        isVisited: hasBit(userFlagValue, Visited),
        isReplayConsumed: hasBit(userFlagValue, ReplayConsumed),
        handleHide: () => {
            return setBits(Hide);
        },
        handleVisit: () => {
            return setBits(Visited);
        },
        /**
         * Both bits have to be written together: two separate calls would each derive the next value from
         * the same stale flag value.
         */
        handleVisitAndConsumeReplay: () => {
            return setBits(Visited | ReplayConsumed);
        },
    };
};

export default useOfferFlags;
