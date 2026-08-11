import { useFlag } from '@proton/unleash/useFlag';

export function useFlagsDriveLumo() {
    const isDriveLumoEnabled = useFlag('DriveWebLumo');
    const isDriveLumoDestructiveActionsDisabledFlag = useFlag('DriveWebLumoDestructiveActionsDisabled');

    return {
        isDriveLumoEnabled,
        isDriveLumoDestructiveActionsDisabled: !isDriveLumoEnabled || isDriveLumoDestructiveActionsDisabledFlag,
    };
}
