import { useState } from 'react';
import { useHistory } from 'react-router-dom';

import type { AuthRouteState } from '../../components/Navigation/routing';
import type { MaybeNull } from '../../types';
import { isMainFrame } from '../../utils/dom/is-main-frame';
import { useVisibleEffect } from '../useVisibleEffect';

type Props = {
    loading: boolean;
    onUnlock: () => Promise<void>;
};

/** Triggers unlock automatically for biometrics related unlocks
 * Consider visibility and if lock has been user initiated */
export const useAutoUnlock = ({ loading, onUnlock }: Props) => {
    const history = useHistory<MaybeNull<AuthRouteState>>();
    const [isError, setIsError] = useState(false);

    useVisibleEffect(
        (visible) => {
            /** if unlock errored, stop triggering automatically */
            if (isError) return;

            /** if user has triggered the lock - don't auto-prompt.  */
            const { userInitiatedLock = false } = history?.location.state ?? {};

            /** If page is hidden away - remove the `userInitiatedLock` flag
             * to force biometrics prompt when re-opening the app */
            if (!visible && userInitiatedLock) history.replace({ ...history.location, state: null });

            /** Allow auto unlock in extension dropdown (in a frame) unfocused */
            const focusOrFrame = document.hasFocus() || !isMainFrame();

            /* Trigger unlock automatically on first render if the app is
             * focused and the current lock was not user initiated */
            if (!visible || loading || !focusOrFrame) return;
            if (!userInitiatedLock) onUnlock().catch(() => setIsError(true));
        },
        [loading, isError]
    );
};
