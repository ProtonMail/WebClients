import { isDevOrBlack } from '@proton/shared/lib/env';
import { useFlag } from '@proton/unleash/useFlag';

export function useFlagsDriveSheet() {
    const isSheetsEnabled = useFlag('DocsSheetsEnabled') || isDevOrBlack();
    const isSheetsDisabled = useFlag('DocsSheetsDisabled');

    return isSheetsEnabled && !isSheetsDisabled;
}
