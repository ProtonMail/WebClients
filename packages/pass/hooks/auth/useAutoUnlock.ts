import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import type { AuthRouteState } from '../../components/Navigation/routing';
import type { Maybe, MaybeNull } from '../../types';
import { isMainFrame } from '../../utils/dom/is-main-frame';
import { useStatefulRef } from '../useStatefulRef';
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
    const focusRetry = useRef<Maybe<() => void>>();

    const cancelFocusRetry = () => {
        if (focusRetry.current) window.removeEventListener('focus', focusRetry.current);
        focusRetry.current = undefined;
    };

    const autoUnlock = useStatefulRef((visible: boolean): void => {
        cancelFocusRetry();

        /** if unlock errored, stop triggering automatically */
        if (isError) return;

        /** if user has triggered the lock - don't auto-prompt.  */
        const { userInitiatedLock = false } = history?.location.state ?? {};

        /** If page is hidden away - remove the `userInitiatedLock` flag
         * to force biometrics prompt when re-opening the app */
        if (!visible && userInitiatedLock) history.replace({ ...history.location, state: null });

        /** Allow auto unlock in extension dropdown (in a frame) unfocused */
        const focusOrFrame = document.hasFocus() || !isMainFrame();

        if (!visible || loading || userInitiatedLock) return;

        /** Firefox may render the popup before focusing it: the focus event
         * does not change visibility, so retry once focus is acquired */
        if (!focusOrFrame) {
            focusRetry.current = () => autoUnlock.current(true);
            return window.addEventListener('focus', focusRetry.current, { once: true });
        }

        onUnlock().catch(() => setIsError(true));
    });

    useVisibleEffect((visible) => autoUnlock.current(visible), [loading, isError]);
    useEffect(() => cancelFocusRetry, []);
};
