import type { ReactNode, RefObject } from 'react';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { c } from 'ttag';

import { Spotlight, useSpotlightShow } from '@proton/components';
import { useSpotlightOnFeature, useUser } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features';
import { useAssistant } from '@proton/llm/lib';

interface Props {
    anchorRef: RefObject<HTMLElement>;
    children: ReactNode;
}

export interface ComposerAssistantInitialSetupSpotlightRef {
    /**
     * Display spotlight and update
     * it's server value to consider it as viewed
     */
    showSpotlight: () => void;
    /** Hide spotlight */
    hideSpotlight: () => void;
    /**
     * Don't show spotlight but update
     * it's server value to consider it as viewed
     */
    setSpotlightViewed: () => void;
}

let displayed = false;

const ComposerAssistantInitialSetupSpotlight = forwardRef<ComposerAssistantInitialSetupSpotlightRef, Props>(
    ({ children, anchorRef }, ref) => {
        const [user] = useUser();
        // Do not show spotlight to free users since they cannot download the model
        const { show: showSpotlightFeature, onDisplayed: onDisplayedComposerSpotlight } = useSpotlightOnFeature(
            FeatureCode.ComposerAssistantInitialSetup,
            !user.isFree
        );
        const show = useSpotlightShow(showSpotlightFeature);
        const { isModelLoadedOnGPU } = useAssistant();
        const [showSpotlight, setShowSpotlight] = useState(false);

        useImperativeHandle(ref, () => ({
            setSpotlightViewed: () => {
                if (!show || displayed) {
                    return;
                }

                onDisplayedComposerSpotlight();
                displayed = true;
            },
            showSpotlight: () => {
                if (!show || displayed) {
                    return;
                }

                setShowSpotlight(true);
                onDisplayedComposerSpotlight();
                displayed = true;
            },
            hideSpotlight: () => {
                if (!showSpotlight) {
                    return;
                }

                setShowSpotlight(false);
            },
        }));

        useEffect(() => {
            // If user has downloaded model on GPU, hide spotlight
            if (isModelLoadedOnGPU) {
                setShowSpotlight(false);
            }
        }, [isModelLoadedOnGPU]);

        return (
            <Spotlight
                originalPlacement="bottom-start"
                show={showSpotlight}
                anchorRef={anchorRef}
                content={
                    <div>
                        <div>
                            {c('Info').t`The initial setup may take a few minutes.`}
                            <br />
                            {c('Info').t`This only needs to be done once.`}
                        </div>
                    </div>
                }
            >
                {children}
            </Spotlight>
        );
    }
);

ComposerAssistantInitialSetupSpotlight.displayName = 'ComposerAssistantInitialSetupSpotlight';

export default ComposerAssistantInitialSetupSpotlight;
