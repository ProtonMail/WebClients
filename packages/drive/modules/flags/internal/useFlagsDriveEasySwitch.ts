import { useFlag } from '@proton/unleash/useFlag';

export function useFlagsDriveEasySwitch() {
    const isEasySwitchEnabled = useFlag('EasySwitchB2CForDriveWeb');
    const isEasySwitchNewUIEnabled = useFlag('EasySwitchB2CForDriveWebNewUI') && isEasySwitchEnabled;

    return {
        isEasySwitchEnabled,
        isEasySwitchNewUIEnabled,
    };
}
