import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMirrorSelfView } from '@proton/meet/store/slices/settings';
import { useFlag } from '@proton/unleash/useFlag';

// Delete this hook and its test when the MeetSelfViewMirrorToggle flag is removed: callers then read selectMirrorSelfView with useMeetSelector, and usePiPRenderer.test.ts stops mocking this hook.
export const useMirrorSelfView = () => {
    const isMirrorToggleEnabled = useFlag('MeetSelfViewMirrorToggle');
    const mirrorSelfView = useMeetSelector(selectMirrorSelfView);

    return !isMirrorToggleEnabled || mirrorSelfView;
};
