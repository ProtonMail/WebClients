import { useEffect, useState } from 'react';

import { useSpotlightOnFeature } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features';

interface Props {
    onToggleAssistant: () => void;
    canShowAssistant: boolean;
    hasCompatibleHardware: boolean;
    hasCompatibleBrowser: boolean;
}
const useComposerAssistantInitialSetup = ({
    onToggleAssistant,
    canShowAssistant,
    hasCompatibleHardware,
    hasCompatibleBrowser,
}: Props) => {
    const [isAssistantInitialSetup, setIsAssistantInitialSetup] = useState(false);

    // Feature flag that we use to open the assistant automatically the first time the user opens the composer
    const { show: showSetupSpotlight, onDisplayed: onDisplayedSetupSpotlight } = useSpotlightOnFeature(
        FeatureCode.ComposerAssistantInitialSetup
    );

    // Feature flag that we use to open the spotlight in the sidebar next to the "New Message" button
    const { show: showSidebarSpotlight, onDisplayed: onDisplayedSidebarSpotlight } = useSpotlightOnFeature(
        FeatureCode.ComposerAssistantSpotlight
    );

    useEffect(() => {
        const canOpenAssistantOnSetup =
            showSetupSpotlight && canShowAssistant && hasCompatibleHardware && hasCompatibleBrowser;
        if (canOpenAssistantOnSetup) {
            setIsAssistantInitialSetup(true);
            onToggleAssistant();
            onDisplayedSetupSpotlight();

            /* If the user account has been created recently, the user won't see the sidebar spotlight.
             * But if the user opens manually the composer in the meantime and sees the assistant,
             * we are setting the feature flag so that the user won't see the spotlight a few days later for no reason
             */
            if (showSidebarSpotlight) {
                onDisplayedSidebarSpotlight();
            }
        }
    }, [
        showSetupSpotlight,
        onDisplayedSetupSpotlight,
        showSidebarSpotlight,
        onDisplayedSidebarSpotlight,
        canShowAssistant,
        hasCompatibleHardware,
        hasCompatibleBrowser,
    ]);

    return { isAssistantInitialSetup };
};

export default useComposerAssistantInitialSetup;
