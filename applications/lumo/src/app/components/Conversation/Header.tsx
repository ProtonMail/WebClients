import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { useRightPanel } from '../../providers/RightPanelProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { NewChatButtonHeader } from '../Buttons/NewChatButton';
import { LumoIcon } from '../LumoIcon/LumoIcon';

import './Header.scss';

export const SidebarToggleButton = ({ className }: { className?: string }) => {
    const { toggle: toggleSideMenu, isVisible } = useSidebar();

    return (
        <Button
            onClick={toggleSideMenu}
            icon
            shape="ghost"
            color="weak"
            size="medium"
            className={clsx('shrink-0', className)}
        >
            <span className="sr-only">
                {isVisible ? c('collider_2025:Button').t`Close sidebar` : c('collider_2025:Action').t`Show sidebar`}
            </span>
            <LumoIcon name="PanelLeft" size={20} />
        </Button>
    );
};

export const DrawerToggleButton = ({ className }: { className?: string }) => {
    const { toggle, isOpen } = useRightPanel();
    return (
        <Button onClick={toggle} icon shape="ghost" color="weak" size="medium" className={clsx('shrink-0', className)}>
            <span className="sr-only">
                {isOpen
                    ? c('collider_2025:Action').t`Hide knowledge panel`
                    : c('collider_2025:Action').t`Show knowledge panel`}
            </span>
            <LumoIcon name="FolderOpen" size={20} />
        </Button>
    );
};

export const Header = ({
    children,
    withoutDrawerToggle = false,
    leftHeaderButton,
    rightHeaderButton,
    showNewChatButton,
}: {
    children: React.ReactNode;
    withoutDrawerToggle?: boolean;
    leftHeaderButton?: React.ReactNode;
    rightHeaderButton?: React.ReactNode;
    showNewChatButton: boolean;
}) => {
    const showRightColumn = !withoutDrawerToggle || !!rightHeaderButton;

    return (
        <div className="lumo-layout-header flex flex-row flex-nowrap justify-space-between w-full p-2">
            <div className="lumo-layout-header-left flex flex-row flex-nowrap justify-start items-center mx-2 shrink-0 gap-1">
                <SidebarToggleButton />
                {showNewChatButton && <NewChatButtonHeader />}
                {leftHeaderButton}
            </div>
            <div className="lumo-layout-header-center flex flex-1 items-center min-w-0">{children}</div>
            <div
                className={clsx(
                    'lumo-layout-header-right flex flex-row flex-nowrap justify-end items-center shrink-0 mx-2 gap-1',
                    !showRightColumn && 'hidden'
                )}
            >
                {rightHeaderButton}
                {!withoutDrawerToggle ? <DrawerToggleButton className="drawer-toggle-button" /> : null}
            </div>
        </div>
    );
};
