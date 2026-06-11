import { useEffect, useLayoutEffect } from 'react';

import { clsx } from 'clsx';

import { Header } from '../components/Conversation/Header';
import { RightPanelSlot, RightPanelSlotWithHeader } from '../components/RightPanelSlot';
import { useRightPanel } from '../providers/RightPanelProvider';

/**
 * Configuration for the header section of the layout
 */
interface HeaderConfig {
    component?: React.ReactNode;
    leftButton?: React.ReactNode;
    showNewChatButton?: boolean;
}

/**
 * Configuration for the drawer/right panel section of the layout
 */
interface DrawerConfig {
    content?: React.ReactNode;
    title?: string;
    actionButton?: React.ReactNode;
    disabled?: boolean;
    defaultOpened?: boolean;
}

/**
 * Props interface for the LumoLayoutWithDrawer component
 */
interface LumoLayoutWithDrawerProps {
    children: React.ReactNode;
    header?: HeaderConfig;
    drawer?: DrawerConfig;
}

export const LumoLayoutWithDrawer = ({ children, header, drawer }: LumoLayoutWithDrawerProps) => {
    const { close, open, isOpen } = useRightPanel();

    // Extract configurations with defaults
    const headerConfig = header || {};
    const drawerConfig = drawer || {};

    const { component: headerComponent, leftButton: leftHeaderButton, showNewChatButton = false } = headerConfig;

    const {
        content: drawerContentComponent,
        title: drawerTitle,
        actionButton: drawerActionButton,
        disabled: withoutDrawerToggle = false,
        defaultOpened = false,
    } = drawerConfig;

    // Automatically close panel if this layout doesn't support panels
    useEffect(() => {
        // If drawer toggle is disabled AND there's no drawer content, close any open panel
        if (withoutDrawerToggle && !drawerContentComponent && isOpen) {
            close();
        }
    }, [withoutDrawerToggle, drawerContentComponent, close, isOpen]);

    // Automatically open panel if defaultOpened is true and drawer is enabled with content
    useLayoutEffect(() => {
        // Open panel synchronously before browser paint to avoid visual flicker
        if (!withoutDrawerToggle && drawerContentComponent && defaultOpened) {
            open();
        }
    }, [defaultOpened, open]);

    return (
        <div
            className={clsx(
                'lumo-layout-container relative flex-1 min-h-0 flex flex-column *:min-size-auto flex-nowrap reset4print overflow-auto rounded-xl'
                // solidBackground && 'bg-norm'
            )}
        >
            <Header
                withoutDrawerToggle={withoutDrawerToggle}
                leftHeaderButton={leftHeaderButton}
                showNewChatButton={showNewChatButton}
            >
                {headerComponent || null}
            </Header>
            {children}
            {drawerContentComponent &&
                (drawerTitle || drawerActionButton ? (
                    <RightPanelSlotWithHeader title={drawerTitle} actionButton={drawerActionButton}>
                        {drawerContentComponent}
                    </RightPanelSlotWithHeader>
                ) : (
                    <RightPanelSlot>{drawerContentComponent}</RightPanelSlot>
                ))}
        </div>
    );
};
