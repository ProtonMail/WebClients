import { Header } from '../components/Conversation/Header';
import { RightPanelSlot, RightPanelSlotWithHeader } from '../components/RightPanelSlot';
import { useDragArea } from '../providers/DragAreaProvider';

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
}

export const LumoLayoutWithDrawer = ({
    children,
    headerComponent,
    drawerContentComponent,
    withoutDrawerToggle = false,
    leftHeaderButton,
    drawerTitle,
    drawerActionButton,
}: LumoLayoutWithDrawerProps) => {
    return (
        <div className="relative flex-1 min-h-0 flex flex-column *:min-size-auto flex-nowrap reset4print overflow-auto rounded-xl bg-norm">
            <Header withoutDrawerToggle={withoutDrawerToggle} leftHeaderButton={leftHeaderButton}>
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
