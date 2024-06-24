import { useEffect, useMemo, useState } from 'react';

import { FeatureFlag, useFlag, useScribePaymentsEnabled } from '@proton/components/containers';
import { useAssistantSubscriptionStatus, useOrganization, useUserSettings } from '@proton/components/hooks';
import {
    getAssistantHasCompatibleBrowser,
    getAssistantHasCompatibleHardware,
    getCanShowAssistant,
} from '@proton/llm/lib';
import useAssistantErrors from '@proton/llm/lib/hooks/useAssistantErrors';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';
import { isOrganizationVisionary } from '@proton/shared/lib/organization/helper';

interface Props {
    assistantFeature: FeatureFlag;
}

const { OFF, UNSET } = AI_ASSISTANT_ACCESS;

const useAssistantCommons = ({ assistantFeature }: Props) => {
    const assistantFeatureEnabled = useFlag(assistantFeature);
    const [{ AIAssistantFlags }] = useUserSettings();
    const [organization] = useOrganization();
    const scribePaymentsEnabled = useScribePaymentsEnabled();

    const assistantSubscriptionStatus = useAssistantSubscriptionStatus();

    const { errors, addSpecificError, cleanSpecificErrors, addGlobalError, cleanGlobalErrors } = useAssistantErrors();

    // Show the feature in the UI only when the feature flag is ON and setting is not OFF
    const canShowAssistant = useMemo(() => {
        // We don't show the assistant to users that are not in supported plan or have the feature disabled
        // In addition, we need to hide the assistant if user can't buy scribe because of payments migration
        const assistantEnabled = getCanShowAssistant(assistantFeatureEnabled) && scribePaymentsEnabled;
        if (!assistantEnabled || AIAssistantFlags === OFF) {
            return false;
        }

        // We don't show the assistant to visionary users that have not set the AIAssistant setting
        const isVisionaryUnset = isOrganizationVisionary(organization) && AIAssistantFlags === UNSET;
        if (isVisionaryUnset) {
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
        // TODO we need to improve the hardware detection, I'm afraid it can lead to false positive with Firefox
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
