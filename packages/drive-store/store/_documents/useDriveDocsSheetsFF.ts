import useFlag from '@proton/unleash/useFlag';
import { isDevOrBlack } from '@proton/utils/env';

export function useIsSheetsEnabled() {
    const isSheetsEnabled = useFlag('DocsSheetsEnabled') || isDevOrBlack();
    const isSheetsDisabled = useFlag('DocsSheetsDisabled');

    return isSheetsEnabled && !isSheetsDisabled;
}
