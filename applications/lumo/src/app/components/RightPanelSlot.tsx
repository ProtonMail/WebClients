import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useRightPanel } from '../providers/RightPanelProvider';

interface Props {
    children: ReactNode;
}

/**
 * Portals children into the persistent RightDrawer content area.
 * Each page/view renders one RightPanelSlot to declare what its right panel shows.
 * When the drawer is closed (contentEl is null), renders nothing.
 */
export const RightPanelSlot = ({ children }: Props) => {
    const { contentEl } = useRightPanel();
    if (!contentEl) {
        return null;
    }
    return createPortal(children, contentEl);
};
