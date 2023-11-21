import React, { useRef } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { Spotlight, useSpotlightShow } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import { useSpotlightOnFeature } from '@proton/components/hooks';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import useSnooze from 'proton-mail/hooks/actions/useSnooze';

interface Props {
    children: React.ReactNode;
}

const SnoozeSpotlight = ({ children }: Props) => {
    const ref = useRef<HTMLDivElement>(null);
    const { canSnooze } = useSnooze();
    const { show: showSpotlight, onDisplayed, onClose } = useSpotlightOnFeature(FeatureCode.SpotlightSnooze, canSnooze);
    const show = useSpotlightShow(showSpotlight);

    return (
        <Spotlight
            originalPlacement="bottom-end"
            show={show}
            onDisplayed={onDisplayed}
            onClose={(e) => {
                e.stopPropagation();
                onClose();
            }}
            anchorRef={ref}
            type="new"
            content={
                <>
                    <p className="text-lg text-bold mb-1 mt-0">{c('Spotlight').t`Snooze it for later`}</p>
                    <p className="m-0">{c('Spotlight')
                        .t`Set when an email should reappear in your inbox with the new snooze feature.`}</p>
                    <Href href={getKnowledgeBaseUrl('/snooze-emails')} onClick={(e) => e.stopPropagation()}>{c('Link')
                        .t`Learn more`}</Href>
                </>
            }
        >
            <div ref={ref}>{children}</div>
        </Spotlight>
    );
};

export default SnoozeSpotlight;
