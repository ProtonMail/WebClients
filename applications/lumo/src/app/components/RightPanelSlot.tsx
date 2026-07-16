import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

import { useRightPanel } from '../providers/RightPanelProvider';

interface Props {
    children: ReactNode;
}

interface RightPanelSlotWithHeaderProps extends Props {
    title?: string;
    actionButton?: ReactNode;
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

/**
 * Enhanced RightPanelSlot that allows setting a title and action button in the drawer header.
 * Use this when you need to customize the drawer header for different contexts.
 */
export const RightPanelSlotWithHeader = ({ children, title, actionButton }: RightPanelSlotWithHeaderProps) => {
    const { contentEl, setHeaderContent } = useRightPanel();

    useLayoutEffect(() => {
        setHeaderContent(title || null, actionButton || null);

        return () => {
            setHeaderContent(null, null);
        };
    }, [title, actionButton, setHeaderContent]);

    if (!contentEl) {
        return null;
    }
    return createPortal(children, contentEl);
};
