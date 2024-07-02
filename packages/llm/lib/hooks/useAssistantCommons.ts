import { useEffect, useMemo, useState } from 'react';

import useAssistantFeatureEnabled from '@proton/components/containers/llm/useAssistantFeatureEnabled';
import { useAssistantSubscriptionStatus, useOrganization, useUserSettings } from '@proton/components/hooks';
import { getAssistantHasCompatibleBrowser, getAssistantHasCompatibleHardware } from '@proton/llm/lib';
import useAssistantErrors from '@proton/llm/lib/hooks/useAssistantErrors';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';
import { isOrganizationVisionary } from '@proton/shared/lib/organization/helper';

const { OFF, UNSET } = AI_ASSISTANT_ACCESS;

const useAssistantCommons = () => {
    const assistantFeatureEnabled = useAssistantFeatureEnabled();
    const [{ AIAssistantFlags }] = useUserSettings();
    const [organization] = useOrganization();

    const assistantSubscriptionStatus = useAssistantSubscriptionStatus();

    const { errors, addSpecificError, cleanSpecificErrors, addGlobalError, cleanGlobalErrors } = useAssistantErrors();

    // Show the feature in the UI only when the feature flag is ON and setting is not OFF
    const canShowAssistant = useMemo(() => {
        // We don't show the assistant to users that are not in supported plan or have the feature disabled
        // In addition, we need to hide the assistant if user can't buy scribe because of payments migration
        const assistantEnabled = assistantFeatureEnabled.enabled;
        if (!assistantEnabled || AIAssistantFlags === OFF) {
            return false;
        }

        // We don't show the assistant to visionary users that have not set the AIAssistant setting
        const isVisionaryUnset = isOrganizationVisionary(organization) && AIAssistantFlags === UNSET;
        if (isVisionaryUnset) {
            return false;
        }

        return true;
    }, [assistantFeatureEnabled, AIAssistantFlags, organization]);

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
        } else {
            setHasCompatibleHardware(compatibility === 'ok');
        }
    };

    useEffect(() => {
        if (canShowAssistant) {
            void handleCheckHardwareCompatibility();
        }
    }, [canShowAssistant]);

    return {
        canShowAssistant,
        hasCompatibleHardware,
        hasCompatibleBrowser,
        canUseAssistant,

        errors,
        addSpecificError,
        cleanSpecificErrors,
        addGlobalError,
        cleanGlobalErrors,

        assistantSubscriptionStatus,
    };
};

export default useAssistantCommons;
