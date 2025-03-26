import { useMemo, useRef } from 'react';

import { fromUnixTime, isAfter } from 'date-fns';
import { c } from 'ttag';

import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode, useFeature } from '@proton/features';

interface Props {
    children: React.ReactNode;
}

const FeatureTourDrawerSpotlight = ({ children }: Props) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const spotlightDisplayDateFlag = useFeature<number>(FeatureCode.FeatureTourDrawerSpotlightDisplayDate);
    const featureTourExpirationDateFlag = useFeature<number>(FeatureCode.FeatureTourExpirationDate);

    const hasExpired =
        !!featureTourExpirationDateFlag.feature?.Value &&
        isAfter(new Date(), fromUnixTime(featureTourExpirationDateFlag.feature.Value));

    const canDisplaySpotlight = useMemo(() => {
        if (spotlightDisplayDateFlag.loading === true) {
            return false;
        }
        const spotlightValue = spotlightDisplayDateFlag.feature?.Value;
        return !!spotlightValue && isAfter(new Date(), fromUnixTime(spotlightValue));
    }, [spotlightDisplayDateFlag.loading]);

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        FeatureCode.FeatureTourDrawerSpotlightDisplayDate,
        canDisplaySpotlight && !hasExpired
    );

    const shouldShowSpotlight = useSpotlightShow(show);

    return (
        <Spotlight
            originalPlacement="right"
            show={shouldShowSpotlight}
            onDisplayed={onDisplayed}
            anchorRef={anchorRef}
            onClose={onClose}
            size="large"
            isAboveModal
            content={
                <div>
                    <p className="mt-0 mb-2 text-bold">{c('Spotlight').t`Discover your subscription benefits`}</p>
                    <p className="m-0">{c('Spotlight')
                        .t`Check out what's included with your subscription and start enjoying the benefits.`}</p>
                </div>
            }
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div ref={anchorRef} onClick={onClose}>
                {children}
            </div>
        </Spotlight>
    );
};

export default FeatureTourDrawerSpotlight;
