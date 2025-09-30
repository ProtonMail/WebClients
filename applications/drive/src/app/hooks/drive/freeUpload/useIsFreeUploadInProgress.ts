import useFlag from '@proton/unleash/useFlag';

import { useFreeUploadStore } from '../../../zustand/freeUpload/freeUpload.store';

// Use this hook instead of store directly because of the kill switch
export function useIsFreeUploadInProgress() {
    const isFreeUploadInProgress = useFreeUploadStore((state) => state.isFreeUploadInProgress);
    const freeUploadKillSwitch = useFlag('DriveFreeMinutesUploadDisabled');

    return isFreeUploadInProgress && !freeUploadKillSwitch;
}
