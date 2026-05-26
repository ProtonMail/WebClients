import { useEffect } from 'react';

import { clsx } from 'clsx';

import { Header } from '../components/Conversation/Header';
import { RightPanelSlot, RightPanelSlotWithHeader } from '../components/RightPanelSlot';
import { useDragArea } from '../providers/DragAreaProvider';
import { useRightPanel } from '../providers/RightPanelProvider';

export const DragAreaContainer = ({ children }: { children: React.ReactNode }) => {
    const { onDrop, onDragLeave, onDragEnter, onDragOver } = useDragArea();

    return (
        <div
            className="relative flex-1 min-h-0 flex flex-column *:min-size-auto flex-nowrap reset4print overflow-auto rounded-xl bg-norm"
            style={{
                border: '1px solid blue',
            }}
            onDrop={onDrop}
            onDragLeave={onDragLeave}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
        >
            {children}
        </div>
    );
};

// TODO: clean up and improve props, etc
interface LumoLayoutWithDrawerProps {
    children: React.ReactNode;
    headerComponent?: React.ReactNode;
    drawerContentComponent?: React.ReactNode;
    withoutDrawerToggle?: boolean;
    leftHeaderButton?: React.ReactNode;
    drawerTitle?: string;
    drawerActionButton?: React.ReactNode;
    showNewChatButton?: boolean;
    solidBackground?: boolean;
}

export const LumoLayoutWithDrawer = ({
    children,
    headerComponent,
    drawerContentComponent,
    withoutDrawerToggle = false,
    leftHeaderButton,
    drawerTitle,
    drawerActionButton,
    showNewChatButton = false,
    solidBackground = true,
}: LumoLayoutWithDrawerProps) => {
    const { close, isOpen } = useRightPanel();

    // Automatically close panel if this layout doesn't support panels
    useEffect(() => {
        // If drawer toggle is disabled AND there's no drawer content, close any open panel
        if (withoutDrawerToggle && !drawerContentComponent && isOpen) {
            close();
        }
    }, [withoutDrawerToggle, drawerContentComponent, close, isOpen]);
    return (
        <div
            className={clsx(
                'lumo-layout-container relative flex-1 min-h-0 flex flex-column *:min-size-auto flex-nowrap reset4print overflow-auto rounded-xl',
                solidBackground && 'bg-norm'
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
