import { useEffect, useMemo, useState } from 'react';

import { useUserSettings } from '@proton/components/hooks';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import useAssistantSubscriptionStatus from '@proton/components/hooks/assistant/useAssistantSubscriptionStatus';
import type { AssistantCommonProps } from '@proton/llm/lib';
import { getAssistantHasCompatibleBrowser, getAssistantHasCompatibleHardware } from '@proton/llm/lib';
import useAssistantErrors from '@proton/llm/lib/hooks/useAssistantErrors';
import useOpenedAssistants from '@proton/llm/lib/hooks/useOpenedAssistants';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

const { OFF } = AI_ASSISTANT_ACCESS;

const useAssistantCommons = (): AssistantCommonProps => {
    const assistantFeatureEnabled = useAssistantFeatureEnabled();
    const canKeepFormatting = useFlag('ComposerAssistantFormatting');
    const [{ AIAssistantFlags }] = useUserSettings();

    const assistantSubscriptionStatus = useAssistantSubscriptionStatus();

    const { errors, addSpecificError, cleanSpecificErrors, addGlobalError, cleanGlobalErrors } = useAssistantErrors();
    const openedAssistantsState = useOpenedAssistants({ cleanSpecificErrors });

    // Show the feature in the UI only when the feature flag is ON and setting is not OFF
    const canShowAssistant = useMemo(() => {
        // We don't show the assistant to users that are not in supported plan or have the feature disabled
        // In addition, we need to hide the assistant if user can't buy scribe because of payments migration
        const assistantEnabled = assistantFeatureEnabled.enabled;
        if (!assistantEnabled || AIAssistantFlags === OFF) {
            return false;
        }

        return true;
    }, [assistantFeatureEnabled, AIAssistantFlags]);

    // When hardware is not compatible, show an error in the UI
    const [hasCompatibleHardware, setHasCompatibleHardware] = useState(false);

    // When the browser is not compatible, suggest the user to run it on a compatible browser
    const [hasCompatibleBrowser, setHasCompatibleBrowser] = useState(getAssistantHasCompatibleBrowser());

    // The assistant can be run if the user is paying the feature or is in trial
    const canUseAssistant = assistantSubscriptionStatus.canUseAssistant;

    const handleCheckHardwareCompatibility = async () => {
        const compatibility = await getAssistantHasCompatibleHardware();
        // If the webGPU is not working on Firefox, propose to the user to use the desktop app instead
        if (compatibility === 'noWebGpuFirefox' || compatibility === 'noWebGpuSafari') {
            setHasCompatibleBrowser(false);
            setHasCompatibleHardware(true);
            return { hasCompatibleBrowser: false, hasCompatibleHardware: true };
        } else {
            setHasCompatibleHardware(compatibility === 'ok');
            return {
                hasCompatibleBrowser: getAssistantHasCompatibleBrowser(),
                hasCompatibleHardware: compatibility === 'ok',
            };
        }
    };

    useEffect(() => {
        if (canShowAssistant && AIAssistantFlags === AI_ASSISTANT_ACCESS.CLIENT_ONLY) {
            void handleCheckHardwareCompatibility();
        } else if (AIAssistantFlags === AI_ASSISTANT_ACCESS.SERVER_ONLY) {
            setHasCompatibleBrowser(true);
            setHasCompatibleHardware(true);
        }
    }, [canShowAssistant, AIAssistantFlags]);

    return {
        canShowAssistant,
        hasCompatibleHardware,
        hasCompatibleBrowser,
        canUseAssistant,
        canKeepFormatting,

        errors,
        addSpecificError,
        cleanSpecificErrors,
        addGlobalError,
        cleanGlobalErrors,

        assistantSubscriptionStatus,
        handleCheckHardwareCompatibility,
        ...openedAssistantsState,
    };
};

export default useAssistantCommons;
