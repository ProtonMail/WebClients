import { clsx } from 'clsx';

import { Button } from '@proton/atoms/Button/Button';

import { useRightPanel } from '../../providers/RightPanelProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { NewChatButtonHeader } from '../Buttons/NewChatButton';

import './Header.scss';

export const DrawerToggleButton = ({ className }: { className?: string }) => {
    const { toggle } = useRightPanel();
    return (
        <Button onClick={toggle} icon shape="solid" color="weak" size="medium" className={clsx('shrink-0', className)}>
            {/* <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                    d="M12.5 1.66602H9.16667C8.72464 1.66602 8.30072 1.84162 7.98816 2.15418C7.6756 2.46674 7.5 2.89066 7.5 3.33269V12.4994C7.5 12.9414 7.6756 13.3653 7.98816 13.6779C8.30072 13.9904 8.72464 14.166 9.16667 14.166H15.8333C16.2754 14.166 16.6993 13.9904 17.0118 13.6779C17.3244 13.3653 17.5 12.9414 17.5 12.4994V6.66602M12.5 1.66602C12.7641 1.66537 13.0257 1.71704 13.2697 1.81801C13.5137 1.91899 13.7353 2.06729 13.9217 2.25436L16.9117 5.24436C17.0987 5.43075 17.247 5.65235 17.348 5.89636C17.449 6.14036 17.5006 6.40195 17.5 6.66602M12.5 1.66602V5.83269C12.5 6.05371 12.5878 6.26567 12.7441 6.42195C12.9004 6.57823 13.1123 6.66603 13.3333 6.66603L17.5 6.66602M4.16667 5.83277C3.72464 5.83277 3.30072 6.00836 2.98816 6.32092C2.67559 6.63349 2.5 7.05741 2.5 7.49944V16.6661C2.5 17.1081 2.67559 17.5321 2.98816 17.8446C3.30072 18.1572 3.72464 18.3328 4.16667 18.3328H10.8333C11.1259 18.3328 11.4133 18.2557 11.6666 18.1095C11.92 17.9632 12.1304 17.7528 12.2767 17.4994"
                    stroke="var(--button-default-text-color)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg> */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--button-default-text-color)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
            </svg>
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
    const { toggle: toggleSideMenu } = useSidebar();
    return (
        <div className="lumo-layout-header flex flex-row flex-nowrap justify-space-between w-full p-2">
            <div className="flex flex-row flex-nowrap justify-start items-center mr-2 shrink-0 gap-1">
                <Button onClick={toggleSideMenu} icon shape="solid" color="weak" size="medium" className="shrink-0">
                    {/* <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                            d="M7.5 2.5V17.5M4.16667 2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5Z"
                            stroke="var(--button-default-text-color)"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg> */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--button-default-text-color)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M15 3v18" />
                    </svg>
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
