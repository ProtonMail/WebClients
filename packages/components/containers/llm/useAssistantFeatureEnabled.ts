import { useFlag, useScribePaymentsEnabled } from '@proton/components/containers';

const useAssistantFeatureEnabled = () => {
    const killSwitch = useFlag('AIAssistantToggleKillSwitch');
    const accessToAssistant = useFlag('ComposerAssistant');
    const scribePaymentsEnabled = useScribePaymentsEnabled();

    return { enabled: accessToAssistant && scribePaymentsEnabled, killSwitch };
};

export default useAssistantFeatureEnabled;

export const useAssistantAddonEnabledSignup = () => {
    const killSwitch = useFlag('AIAssistantToggleKillSwitch');
    const enabled = useFlag('AIAssistantAddonSignup');
    return !killSwitch && enabled;
};
