import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

import {
    useOptionalArtifactPanelHostActions,
    useOptionalArtifactPanelHostLayout,
} from '../../../providers/ArtifactPanelHostProvider';

interface Props {
    children: ReactNode;
}

const hasPortalContent = (children: ReactNode): boolean => {
    return children !== null && children !== false && children !== undefined;
};

/**
 * Portals the docked artifact panel into the layout shell beside main content (see ArtifactPanelHost).
 */
export const ArtifactPanelSlot = ({ children }: Props) => {
    const layout = useOptionalArtifactPanelHostLayout();
    const actions = useOptionalArtifactPanelHostActions();
    const shouldShow = hasPortalContent(children);
    const mountEl = layout?.mountEl ?? null;

    useLayoutEffect(() => {
        if (!actions) {
            return;
        }
        actions.setHostVisible(shouldShow);
        return () => {
            actions.setHostVisible(false);
        };
    }, [actions, shouldShow]);

    if (!layout || !actions || !mountEl || !shouldShow) {
        return null;
    }

    return createPortal(children, mountEl);
};
