import { ReactNode, RefObject } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Spotlight, useSpotlightShow } from '@proton/components/components';
import { ASSISTANT_TRIAL_TIME_DAYS } from '@proton/llm/lib';

interface Props {
    anchorRef: RefObject<HTMLElement>;
    children: ReactNode;
    isInitialSetup?: boolean;
}

const ComposerAssistantInitialSetupSpotlight = ({ children, anchorRef, isInitialSetup = false }: Props) => {
    const shouldShowSpotlight = useSpotlightShow(isInitialSetup);

    const handleClickSubscribe = () => {
        // TODO
    };

    // TODO adapt for org members
    const subscribeButton = (
        <Button onClick={handleClickSubscribe} shape="underline" color="norm">{c('loc_nightly_assistant')
            .t`subscribe now`}</Button>
    );
    const subscribeText = c('loc_nightly_assistant')
        .jt`Try it for free for ${ASSISTANT_TRIAL_TIME_DAYS} days or ${subscribeButton}.`;

    return (
        <Spotlight
            originalPlacement="bottom-start"
            show={shouldShowSpotlight}
            anchorRef={anchorRef}
            content={
                <>
                    <div>
                        {c('loc_nightly_assistant')
                            .t`The initial setup may take a few minutes and only needs to be done once.`}
                    </div>
                    <div>{subscribeText}</div>
                </>
            }
        >
            {children}
        </Spotlight>
    );
};

export default ComposerAssistantInitialSetupSpotlight;
