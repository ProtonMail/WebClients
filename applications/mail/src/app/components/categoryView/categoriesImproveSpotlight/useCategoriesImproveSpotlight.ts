import { useState } from 'react';

import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { SECOND } from '@proton/shared/lib/constants';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

const DISPLAY_DELAY = 3 * SECOND;

export const useCategoriesImproveSpotlight = () => {
    const isNewEmbeddingEnabled = useFlag(MailFeatureFlag.UseUserEmbedding);
    const { feature: seenFeature, loading, update } = useFeature<boolean>(FeatureCode.SpotlightCategoriesImproved);

    // Latched so marking the spotlight as seen on display does not hide it straight away
    const [wasSeenOnLoad, setWasSeenOnLoad] = useState<boolean>();
    const [isClosed, setIsClosed] = useState(false);

    if (wasSeenOnLoad === undefined && !loading) {
        setWasSeenOnLoad(!!seenFeature?.Value);
    }

    const isEligible = isNewEmbeddingEnabled && wasSeenOnLoad === false && !isClosed;
    const show = useSpotlightShow(isEligible, DISPLAY_DELAY);

    const onDisplayed = () => {
        void update(true);
    };

    const onClose = () => setIsClosed(true);

    return { isEligible, show, onDisplayed, onClose };
};
