import { ReactNode, RefObject, forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { c } from 'ttag';

import { Spotlight } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import { useSpotlightOnFeature } from '@proton/components/hooks';
import { useAssistant } from '@proton/llm/lib';

interface Props {
    anchorRef: RefObject<HTMLElement>;
    children: ReactNode;
}

export interface ComposerAssistantInitialSetupSpotlightRef {
    showSpotlight: () => void;
    hideSpotlight: () => void;
}

const ComposerAssistantInitialSetupSpotlight = forwardRef<ComposerAssistantInitialSetupSpotlightRef, Props>(
    ({ children, anchorRef }, ref) => {
        const { show, onDisplayed: onDisplayedComposerSpotlight } = useSpotlightOnFeature(
            FeatureCode.ComposerAssistantInitialSetup
        );
        const { isModelLoadedOnGPU } = useAssistant();
        const [showSpotlight, setShowSpotlight] = useState(false);

        useImperativeHandle(ref, () => ({
            showSpotlight: () => {
                if (!show) {
                    return;
                }

                setShowSpotlight(true);
                onDisplayedComposerSpotlight();
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
