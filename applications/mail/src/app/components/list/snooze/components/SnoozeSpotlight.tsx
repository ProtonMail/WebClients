import React, { useRef } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { Spotlight } from '@proton/components/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props {
    show: boolean;
    onDisplayed: () => void;
    onClose: () => void;
    children: React.ReactNode;
}

const SnoozeSpotlight = ({ children, show, onDisplayed, onClose }: Props) => {
    const ref = useRef<HTMLDivElement>(null);

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
