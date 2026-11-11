import { useUser } from '@proton/account/user/hooks';
import { useLocalStateSync } from '@proton/components/hooks/useLocalStateSync';

const DETECTION_ENABLED_KEY = 'one-time-code-detection-enabled';
const MOVE_TO_TRASH_KEY = 'one-time-code-move-to-trash';

// One hook per preference, so a list row subscribes only to the preference it reads.
export const useOneTimeCodeDetectionPreference = (): [boolean, (enabled: boolean) => void] => {
    const [user] = useUser();
    return useLocalStateSync<boolean>(true, `${DETECTION_ENABLED_KEY}-${user.ID}`);
};

export const useOneTimeCodeMoveToTrashPreference = (): [boolean, (enabled: boolean) => void] => {
    const [user] = useUser();
    return useLocalStateSync<boolean>(true, `${MOVE_TO_TRASH_KEY}-${user.ID}`);
};

export const useOneTimeCodeSettings = (): {
    detectionEnabled: boolean;
    setDetectionEnabled: (enabled: boolean) => void;
    moveToTrashEnabled: boolean;
    setMoveToTrashEnabled: (enabled: boolean) => void;
} => {
    const [detectionEnabled, setDetectionEnabled] = useOneTimeCodeDetectionPreference();
    const [moveToTrashEnabled, setMoveToTrashEnabled] = useOneTimeCodeMoveToTrashPreference();

    return { detectionEnabled, setDetectionEnabled, moveToTrashEnabled, setMoveToTrashEnabled };
};
