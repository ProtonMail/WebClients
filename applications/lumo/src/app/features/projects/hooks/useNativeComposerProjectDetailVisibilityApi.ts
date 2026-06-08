import { useEffect } from 'react';

import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';

/**
 * Hides the native composer while a project-detail modal is open, and shows it
 * again once it closes.
 *
 * The caller passes one combined flag for all such modals instead of calling
 * this hook per modal. With a single flag the composer stays hidden while any
 * of them is open and is only restored once they're all closed.
 */
export const useNativeComposerProjectDetailVisibilityApi = (shouldHideComposer: boolean): void => {
    useEffect(() => {
        if (!shouldHideComposer) {
            return;
        }
        setNativeComposerVisibility(false);
        return () => setNativeComposerVisibility(true);
    }, [shouldHideComposer]);
};
