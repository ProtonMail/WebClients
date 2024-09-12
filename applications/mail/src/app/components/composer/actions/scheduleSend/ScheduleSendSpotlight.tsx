import type { ReactElement, RefObject } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Spotlight, useSpotlightShow } from '@proton/components';
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
                <div className="flex flex-nowrap my-2">
                    <div className="shrink-0 mr-4">
                        <img src={scheduledImg} className="w-custom" style={{ '--w-custom': '4em' }} alt="" />
                    </div>
                    <div>
                        <p className="mt-0 mb-2 text-bold" data-testid="composer:schedule-send:spotlight-title">{c(
                            'Spotlight'
                        ).t`Schedule send`}</p>
                        <p className="m-0">{c('Spotlight').t`You can now schedule your messages to be sent later`}</p>
                        <Href href={getKnowledgeBaseUrl('/schedule-email-send')} title="Scheduled send">
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
