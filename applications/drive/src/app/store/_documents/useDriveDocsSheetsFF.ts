import useFlag from '@proton/unleash/useFlag';
import { isDevOrBlack } from '@proton/utils/env';

export function useDriveDocsSheetsFF() {
    const isSheetsEnabled = useFlag('DocsSheetsEnabled') || isDevOrBlack();

    return {
        isSheetsEnabled,
    };
}
