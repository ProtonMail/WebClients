import { ReactElement, RefObject } from 'react';

import { c } from 'ttag';

import { Href, Spotlight, useSpotlightShow } from '@proton/components/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import scheduledImg from '@proton/styles/assets/img/illustrations/spotlight-scheduled-send.svg';

interface Props {
    anchorRef: RefObject<HTMLElement>;
    children: ReactElement;
    onDisplayed: () => void;
    showSpotlight: boolean;
}

const ScheduleSendSpotlight = ({ children, showSpotlight, onDisplayed, anchorRef }: Props) => {
    const shouldShowSpotlight = useSpotlightShow(showSpotlight);

    return (
        <Spotlight
            originalPlacement="top-end"
            show={shouldShowSpotlight}
            onDisplayed={onDisplayed}
            anchorRef={anchorRef}
            size="large"
            content={
                <div className="flex flex-nowrap mt0-5 mb0-5">
                    <div className="flex-item-noshrink mr1">
                        <img src={scheduledImg} className="w4e" alt="" />
                    </div>
                    <div>
                        <p className="mt0 mb0-5 text-bold" data-testid="composer:schedule-send:spotlight-title">{c(
                            'Spotlight'
                        ).t`Schedule send`}</p>
                        <p className="m0">{c('Spotlight').t`You can now schedule your messages to be sent later`}</p>
                        <Href url={getKnowledgeBaseUrl('/schedule-email-send')} title="Scheduled send">
                            {c('Info').t`Learn more`}
                        </Href>
                    </div>
                </div>
            }
        >
            {children}
        </Spotlight>
    );
};

export default ScheduleSendSpotlight;
