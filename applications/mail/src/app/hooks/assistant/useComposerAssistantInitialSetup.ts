import { useEffect, useState } from 'react';

import { useSpotlightOnFeature } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features';

interface Props {
    canShowAssistant: boolean;
    disableAssistantButton: boolean;
}
const useComposerAssistantInitialSetup = ({ canShowAssistant, disableAssistantButton }: Props) => {
    const [isAssistantInitialSetup, setIsAssistantInitialSetup] = useState(false);

    // Feature flag that we use to open the assistant automatically the first time the user opens the composer
    const { show: showComposerSpotlight, onDisplayed: onDisplayedComposerSpotlight } = useSpotlightOnFeature(
        FeatureCode.ComposerAssistantInitialSetup
    );

    // Feature flag that we use to open the spotlight in the sidebar next to the "New Message" button
    const { show: showSidebarSpotlight, onDisplayed: onDisplayedSidebarSpotlight } = useSpotlightOnFeature(
        FeatureCode.ComposerAssistantSpotlight
    );

    useEffect(() => {
        /** Do not display the assistant by default when local storage value is false
         * This is happening when the user has the setup the first time he opens the composer.
         * If he clicked on the cross during the option choice, we set the value to false,
         * so that we don't open the assistant next time.
         * The default value being true, on the first opening, the assistant should be opened
         */
        const canOpenAssistantOnSetup = showComposerSpotlight && canShowAssistant && !disableAssistantButton;
        if (canOpenAssistantOnSetup) {
            setIsAssistantInitialSetup(true);

            /* If the user account has been created recently, the user won't see the sidebar spotlight.
             * But if the user opens manually the composer in the meantime and sees the assistant,
             * we are setting the feature flag so that the user won't see the spotlight a few days later for no reason
             */
            if (showSidebarSpotlight) {
                onDisplayedSidebarSpotlight();
            }
        }
    }, [
        showComposerSpotlight,
        onDisplayedComposerSpotlight,
        showSidebarSpotlight,
        onDisplayedSidebarSpotlight,
        canShowAssistant,
    ]);

    return { isAssistantInitialSetup };
};

export default useComposerAssistantInitialSetup;
