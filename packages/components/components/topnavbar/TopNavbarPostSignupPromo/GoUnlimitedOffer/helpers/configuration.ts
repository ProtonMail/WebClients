import { useEffect, useMemo, useState } from 'react';

import { differenceInDays, fromUnixTime, getUnixTime } from 'date-fns';
import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { CYCLE, PLANS, getPlanByName } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import {
    featureListDrive,
    featureListGeneric,
    featureListInboxThreatProtection,
    featureListInboxUnlimitedAliases,
    featureListPass,
    featureListVPNBrowseSecurely,
    featureListVPNUnblockStreaming,
} from './features';
import {
    POST_SIGNUP_GO_UNLIMITED_DURATION,
    UnlimitedMessageType,
    type UnlimitedOfferConfig,
    type UnlimitedOfferTipProps,
} from './interface';

const getTips = (): UnlimitedOfferTipProps[] => [
    {
        type: UnlimitedMessageType.Generic,
        cta: c('specialoffer: Link').t`Do more with ${BRAND_NAME}`,
        spotlightTitle: c('specialoffer: Title').t`Get one plan that includes it all, get ${BRAND_NAME} Unlimited`,
        features: featureListGeneric,
    },
    {
        type: UnlimitedMessageType.InboxThreatProtection,
        cta: c('specialoffer: Link').t`Guard against threats`,
        spotlightTitle: c('specialoffer: Title').t`Protect your account from threats with Sentinel`,
        features: featureListInboxThreatProtection,
    },
    {
        type: UnlimitedMessageType.InboxUnlimitedAliases,
        cta: c('specialoffer: Link').t`Get unlimited aliases`,
        spotlightTitle: c('specialoffer: Title').t`Get unlimited aliases to protect your identity and reduce spam`,
        features: featureListInboxUnlimitedAliases,
    },
    {
        type: UnlimitedMessageType.Drive,
        cta: c('specialoffer: Link').t`Increase your storage`,
        spotlightTitle: c('specialoffer: Title').t`Get 500 GB to securely store all your files and photos`,
        features: featureListDrive,
    },
    {
        type: UnlimitedMessageType.VPNBrowseSecurely,
        cta: c('specialoffer: Link').t`Browse securely`,
        spotlightTitle: c('specialoffer: Title').t`Get access to ultrafast VPN servers in 110+ countries`,
        features: featureListVPNBrowseSecurely,
    },
    {
        type: UnlimitedMessageType.VPNUnblockStreaming,
        cta: c('specialoffer: Link').t`Unblock streaming content`,
        spotlightTitle: c('specialoffer: Title').t`Access content on streaming services worldwide`,
        features: featureListVPNUnblockStreaming,
    },
    {
        type: UnlimitedMessageType.Pass,
        cta: c('specialoffer: Link').t`Keep passwords safe`,
        spotlightTitle: c('specialoffer: Title').t`Keep your passwords safe and organized in multiple vaults`,
        features: featureListPass,
    },
];

export const useGoUnlimited2025Config = (): UnlimitedOfferConfig => {
    const [user] = useUser();
    const [plansResult] = usePlans();

    const currency = user.Currency;
    const unlimitedPlan = getPlanByName(plansResult?.plans ?? [], PLANS.BUNDLE, currency);
    const price = (unlimitedPlan?.Pricing?.[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    const {
        feature: lastRotationDateFeature,
        update,
        loading: loadingRotationState,
    } = useFeature(FeatureCode.OfferUnlimitedRotationState);

    const tips = useMemo(() => getTips(), []);

    const updateRotationIdNeeded = () => {
        if (!lastRotationDateFeature?.Value.rotationDate) {
            return false;
        }

        if (lastRotationDateFeature.Value.rotationDate === 0) {
            void update({ rotationDate: getUnixTime(new Date()), rotationIndex: 0 });
            return false;
        }
        const lastRotationDate = fromUnixTime(lastRotationDateFeature.Value.rotationDate);
        const daysSinceLastRotationDate = differenceInDays(new Date(), lastRotationDate);

        if (daysSinceLastRotationDate >= POST_SIGNUP_GO_UNLIMITED_DURATION) {
            const storedIndex = lastRotationDateFeature.Value.rotationIndex;
            const nextIndex = (storedIndex + 1) % tips.length;
            setCurrentTipIndex(nextIndex);
            void update({ rotationDate: getUnixTime(new Date()), rotationIndex: nextIndex });
            return true;
        }

        return false;
    };

    useEffect(() => {
        if (!loadingRotationState) {
            updateRotationIdNeeded();
        }
    }, [loadingRotationState]);

    const selectedTip = tips[currentTipIndex];

    return {
        type: selectedTip.type,
        title: selectedTip.spotlightTitle,
        features: selectedTip.features,
        currency,
        price,
        topButton: {
            shape: 'outline',
            title: selectedTip.cta,
            variant: 'go-unlimited-2025',
            gradient: false,
            icon: 'light-lightbulb',
        },
        loading: loadingRotationState ?? true,
    };
};
