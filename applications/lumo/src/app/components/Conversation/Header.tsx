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
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M5.00002 11.6666L6.25002 9.24996C6.38591 8.98008 6.59262 8.75221 6.84803 8.59075C7.10344 8.42928 7.39794 8.34029 7.70002 8.33329H16.6667M16.6667 8.33329C16.9213 8.33284 17.1726 8.39074 17.4014 8.50253C17.6301 8.61432 17.8302 8.77703 17.9863 8.97818C18.1424 9.17933 18.2504 9.41357 18.3018 9.66292C18.3533 9.91227 18.347 10.1701 18.2834 10.4166L17 15.4166C16.9072 15.7763 16.6969 16.0946 16.4025 16.321C16.1081 16.5475 15.7464 16.6691 15.375 16.6666H3.33335C2.89133 16.6666 2.4674 16.491 2.15484 16.1785C1.84228 15.8659 1.66669 15.442 1.66669 15V4.16662C1.66669 3.7246 1.84228 3.30067 2.15484 2.98811C2.4674 2.67555 2.89133 2.49996 3.33335 2.49996H6.58335C6.86209 2.49723 7.13707 2.56445 7.3831 2.69547C7.62914 2.8265 7.83839 3.01715 7.99169 3.24996L8.66669 4.24996C8.81845 4.4804 9.02504 4.66956 9.26794 4.80046C9.51083 4.93136 9.78243 4.99991 10.0584 4.99996H15C15.442 4.99996 15.866 5.17555 16.1785 5.48811C16.4911 5.80067 16.6667 6.2246 16.6667 6.66662V8.33329Z"
                    stroke="var(--button-default-text-color)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
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
