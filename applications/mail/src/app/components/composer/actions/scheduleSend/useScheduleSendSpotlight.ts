import { useRef } from 'react';

import { useSpotlightOnFeature } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features';

import useScheduleSendFeature from './useScheduleSendFeature';

const useScheduleSendSpotlight = (canDisplaySpotlight: boolean) => {
    const { canScheduleSend } = useScheduleSendFeature();
    const anchorRef = useRef<HTMLDivElement>(null);
    const spotlight = useSpotlightOnFeature(FeatureCode.SpotlightScheduledSend, canScheduleSend && canDisplaySpotlight);

    return {
        spotlight,
        anchorRef,
    };
};

export default useScheduleSendSpotlight;
