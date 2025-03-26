import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import spotlightImg from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

interface Props extends PropsWithChildren {}

const SpotlightContent = () => {
    return (
        <>
            <div className="flex flex-nowrap items-start mb-1 gap-4">
                <div className="shrink-0">
                    <img alt="" src={spotlightImg} className="w-custom" style={{ '--w-custom': '2.75rem' }} />
                </div>
                <div className="flex flex-column flex-nowrap items-start">
                    <p className="text-lg text-bold m-0 mb-1">{c('Title').t`New! Reply with a note`}</p>
                    <p className="m-0">{c('Label')
                        .t`Let others know if you have a conflict, will be late, or can’t wait for the event.`}</p>
                </div>
            </div>
        </>
    );
};

export const RsvpSpotlight = ({ children }: Props) => {
    const {
        welcomeFlags: { isWelcomeFlow },
    } = useWelcomeFlags();

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(FeatureCode.CalendarRsvpNoteSpotlight, !isWelcomeFlow);

    const shouldShowSpotlight = useSpotlightShow(show);

    return (
        <Spotlight
            show={shouldShowSpotlight}
            content={<SpotlightContent />}
            onDisplayed={onDisplayed}
            onClose={onClose}
            originalPlacement="right"
            className="ml-3"
            isAboveModal
        >
            {children}
        </Spotlight>
    );
};
