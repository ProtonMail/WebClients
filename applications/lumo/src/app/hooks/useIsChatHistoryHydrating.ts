import { useIsGuest } from '../providers/IsGuestProvider';
import { useLumoSelector } from '../redux/hooks';
import { selectMasterKeyState } from '../redux/selectors';

/**
 * True while local chat history has not finished loading from IndexedDB.
 * Keeps list views on a skeleton instead of flashing an empty state.
 *
 * Failed/ineligible master-key states never run `initAppSaga`, so we must not spin forever.
 */
export const useIsChatHistoryHydrating = (): boolean => {
    const isGuest = useIsGuest();
    const reduxLoadedFromIdb = useLumoSelector((state) => state.initialization.reduxLoadedFromIdb);
    const masterKeyState = useLumoSelector(selectMasterKeyState);

    if (isGuest || reduxLoadedFromIdb) {
        return false;
    }

    return masterKeyState.status !== 'failed' && masterKeyState.status !== 'ineligible';
};
