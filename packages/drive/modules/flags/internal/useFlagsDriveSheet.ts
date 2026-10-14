import { useFlag } from '@proton/unleash/useFlag';

export function useFlagsDriveSheet() {
    const isSheetsDisabled = useFlag('DocsSheetsDisabled');

    return !isSheetsDisabled;
}
