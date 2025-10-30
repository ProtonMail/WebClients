import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { CYCLE, DEFAULT_CURRENCY, PLANS, getPlanByName } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { featureListAdditionalUser, featureListStorageUpgrade } from './features';
import type { UnlimitedToDuoOfferConfig, UnlimitedToDuoRotationState, UnlimitedToDuoTipProps } from './interface';
import { UnlimitedToDuoMessageType } from './interface';
import { calculateRotationUpdate } from './tipRotationLogic';

const getTips = (): UnlimitedToDuoTipProps[] => [
    {
        type: UnlimitedToDuoMessageType.GetFourTimesMoreStorage,
        cta: c('Duo offer: Link').t`Get 4x more storage`,
        spotlightTitle: c('Duo offer: Title').t`Get 4x more storage with ${BRAND_NAME} Duo`,
        features: featureListStorageUpgrade,
    },
    {
        type: UnlimitedToDuoMessageType.ShareYourPlan,
        cta: c('Duo offer: Link').t`Share your plan`,
        spotlightTitle: c('Duo offer: Title').t`Share your plan benefits with ${BRAND_NAME} Duo`,
        features: featureListAdditionalUser,
    },
];

export const useUnlimitedToDuoConfig = (): UnlimitedToDuoOfferConfig => {
    const [user] = useUser();
    const [plansResults] = usePlans();
    const {
        feature: unlimitedToDuoRotationState,
        update,
        loading: loadingRotationState,
    } = useFeature<UnlimitedToDuoRotationState>(FeatureCode.UnlimitedToDuoRotationState);

    const [selectedTipIndex, setSelectedTipIndex] = useState(0);

    const currency = user?.Currency || DEFAULT_CURRENCY;
    const duoPlan = getPlanByName(plansResults?.plans ?? [], PLANS.DUO, currency);
    const price = (duoPlan?.Pricing?.[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    const tips = useMemo(() => getTips(), []);

    const updateRotationState = (): void => {
        if (!unlimitedToDuoRotationState?.Value) {
            return;
        }

        const result = calculateRotationUpdate(
            unlimitedToDuoRotationState.Value.rotationDate,
            unlimitedToDuoRotationState.Value.tipIndex,
            tips.length
        );

        if (result) {
            setSelectedTipIndex(result.tipIndex);
            void update(result);
        }
    };

    useEffect(() => {
        if (!loadingRotationState) {
            updateRotationState();
        }
    }, [loadingRotationState]);

    const selectedTip = tips[selectedTipIndex];

    return {
        type: selectedTip.type,
        title: selectedTip.spotlightTitle,
        features: selectedTip.features,
        currency,
        price,
        topButton: {
            shape: 'outline',
            title: selectedTip.cta,
            gradient: false,
            icon: 'lightbulb',
        },
        loading: loadingRotationState ?? true,
    };
};
