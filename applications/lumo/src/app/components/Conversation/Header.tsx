import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { useRightPanel } from '../../providers/RightPanelProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { NewChatButtonHeader } from '../Buttons/NewChatButton';
import { LumoIcon } from '../LumoIcon/LumoIcon';

import './Header.scss';

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
    showNewChatButton,
}: {
    children: React.ReactNode;
    withoutDrawerToggle?: boolean;
    leftHeaderButton?: React.ReactNode;
    showNewChatButton: boolean;
}) => {
    const { toggle: toggleSideMenu, isVisible } = useSidebar();
    return (
        <div className="lumo-layout-header flex flex-row flex-nowrap justify-space-between w-full p-2 pt-1">
            <div className="flex flex-row flex-nowrap justify-start items-center mr-2 shrink-0 gap-1">
                <Button onClick={toggleSideMenu} icon shape="ghost" color="weak" size="medium" className="shrink-0">
                    <span className="sr-only">
                        {isVisible
                            ? c('collider_2025:Button').t`Close sidebar`
                            : c('collider_2025:Action').t`Show sidebar`}
                    </span>
                    <LumoIcon name="PanelRight" size={20} />
                </Button>
                {showNewChatButton && <NewChatButtonHeader />}
                {leftHeaderButton}
            </div>
            {children}
            <div className="flex flex-row flex-nowrap justify-end items-center shrink-0">
                <DrawerToggleButton
                    className={clsx('drawer-toggle-button', withoutDrawerToggle && 'visibility-hidden')}
                />
            </div>
        </div>
    );
};
