import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Spotlight, useSpotlightShow } from '@proton/components/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import spotlightImg from '@proton/styles/assets/img/illustrations/ai-assistant-spotlight.svg';

interface Props {
    children: ReactNode;
    onClose: () => void;
    onDisplayed: () => void;
    show: boolean;
}

const ComposerAssistantSpotlight = ({ children, show, onClose, onDisplayed }: Props) => {
    const shouldShowSpotlight = useSpotlightShow(show);
    return (
        <Spotlight
            originalPlacement="top"
            show={shouldShowSpotlight}
            onClose={onClose}
            onDisplayed={onDisplayed}
            content={
                <div className="flex flex-nowrap gap-x-2">
                    <div className="shrink-0">
                        <img src={spotlightImg} alt="" />
                    </div>
                    <div>
                        <b>{c('Info').t`Your private writing assistant`}</b>
                        <br />
                        {c('Info').t`${BRAND_NAME} Scribe helps you craft better emails quickly and effortlessly.`}
                    </div>
                </div>
            }
        >
            {children}
        </Spotlight>
    );
};

export default ComposerAssistantSpotlight;
