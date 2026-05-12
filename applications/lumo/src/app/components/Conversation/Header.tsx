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
            {/* <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="12" fill="#F5F6FE" />
                <path
                    d="M22.5 11.666H19.1667C18.7246 11.666 18.3007 11.8416 17.9882 12.1542C17.6756 12.4667 17.5 12.8907 17.5 13.3327V22.4994C17.5 22.9414 17.6756 23.3653 17.9882 23.6779C18.3007 23.9904 18.7246 24.166 19.1667 24.166H25.8333C26.2754 24.166 26.6993 23.9904 27.0118 23.6779C27.3244 23.3653 27.5 22.9414 27.5 22.4994V16.666M22.5 11.666C22.7641 11.6654 23.0257 11.717 23.2697 11.818C23.5137 11.919 23.7353 12.0673 23.9217 12.2544L26.9117 15.2444C27.0987 15.4308 27.247 15.6523 27.348 15.8964C27.449 16.1404 27.5006 16.4019 27.5 16.666M22.5 11.666V15.8327C22.5 16.0537 22.5878 16.2657 22.7441 16.4219C22.9004 16.5782 23.1123 16.666 23.3333 16.666L27.5 16.666M14.1667 15.8328C13.7246 15.8328 13.3007 16.0084 12.9882 16.3209C12.6756 16.6335 12.5 17.0574 12.5 17.4994V26.6661C12.5 27.1081 12.6756 27.5321 12.9882 27.8446C13.3007 28.1572 13.7246 28.3328 14.1667 28.3328H20.8333C21.1259 28.3328 21.4133 28.2557 21.6666 28.1095C21.92 27.9632 22.1304 27.7528 22.2767 27.4994"
                    stroke="#0B0B0B"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg> */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                    d="M12.5 1.66602H9.16667C8.72464 1.66602 8.30072 1.84162 7.98816 2.15418C7.6756 2.46674 7.5 2.89066 7.5 3.33269V12.4994C7.5 12.9414 7.6756 13.3653 7.98816 13.6779C8.30072 13.9904 8.72464 14.166 9.16667 14.166H15.8333C16.2754 14.166 16.6993 13.9904 17.0118 13.6779C17.3244 13.3653 17.5 12.9414 17.5 12.4994V6.66602M12.5 1.66602C12.7641 1.66537 13.0257 1.71704 13.2697 1.81801C13.5137 1.91899 13.7353 2.06729 13.9217 2.25436L16.9117 5.24436C17.0987 5.43075 17.247 5.65235 17.348 5.89636C17.449 6.14036 17.5006 6.40195 17.5 6.66602M12.5 1.66602V5.83269C12.5 6.05371 12.5878 6.26567 12.7441 6.42195C12.9004 6.57823 13.1123 6.66603 13.3333 6.66603L17.5 6.66602M4.16667 5.83277C3.72464 5.83277 3.30072 6.00836 2.98816 6.32092C2.67559 6.63349 2.5 7.05741 2.5 7.49944V16.6661C2.5 17.1081 2.67559 17.5321 2.98816 17.8446C3.30072 18.1572 3.72464 18.3328 4.16667 18.3328H10.8333C11.1259 18.3328 11.4133 18.2557 11.6666 18.1095C11.92 17.9632 12.1304 17.7528 12.2767 17.4994"
                    stroke="var(--button-default-text-color)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </Button>
    );
};

/**
 * Persistent right panel that sits as a flex sibling and pushes main content left.
 * The parent container must be a flex row.
 * Page-level components inject content via RightPanelSlot, which portals into the
 * content div registered here.
 */
// export const Header = ({ conversation }: { conversation?: Conversation }) => {
//     const { messageChain } = useConversationActions();
//     const { toggle, isOpen } = useRightPanel();
//     const { isVisible: isSideMenuOpen, toggle: toggleSideMenu } = useSidebar();
//     return (
//         <div className="flex flex-row flex-nowrap justify-space-between w-full">
//             <Button onClick={toggleSideMenu} icon shape="ghost" color="weak" size="small">
//                 {/* <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <rect width="40" height="40" rx="12" fill="#F5F6FE" />
//                     <path
//                         d="M17.5 12.5V27.5M14.1667 12.5H25.8333C26.7538 12.5 27.5 13.2462 27.5 14.1667V25.8333C27.5 26.7538 26.7538 27.5 25.8333 27.5H14.1667C13.2462 27.5 12.5 26.7538 12.5 25.8333V14.1667C12.5 13.2462 13.2462 12.5 14.1667 12.5Z"
//                         stroke="#0B0B0B"
//                         stroke-width="1.4"
//                         stroke-linecap="round"
//                         stroke-linejoin="round"
//                     />
//                 </svg> */}
//                 <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <rect width="40" height="40" rx="12" fill="#F5F6FE" />
//                     <path
//                         d="M17.5 12.5V27.5M14.1667 12.5H25.8333C26.7538 12.5 27.5 13.2462 27.5 14.1667V25.8333C27.5 26.7538 26.7538 27.5 25.8333 27.5H14.1667C13.2462 27.5 12.5 26.7538 12.5 25.8333V14.1667C12.5 13.2462 13.2462 12.5 14.1667 12.5Z"
//                         stroke="#0B0B0B"
//                         stroke-width="1.4"
//                         stroke-linecap="round"
//                         stroke-linejoin="round"
//                     />
//                 </svg>
//             </Button>
//             {conversation && (
//                 <ConversationHeader
//                     conversation={conversation}
//                     messageChain={messageChain}
//                     onOpenFiles={() => toggle()}
//                 />
//             )}
//             {/* <Button onClick={toggle} icon shape="ghost" color="weak" size="small">
//                 <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <rect width="40" height="40" rx="12" fill="#F5F6FE" />
//                     <path
//                         d="M22.5 11.666H19.1667C18.7246 11.666 18.3007 11.8416 17.9882 12.1542C17.6756 12.4667 17.5 12.8907 17.5 13.3327V22.4994C17.5 22.9414 17.6756 23.3653 17.9882 23.6779C18.3007 23.9904 18.7246 24.166 19.1667 24.166H25.8333C26.2754 24.166 26.6993 23.9904 27.0118 23.6779C27.3244 23.3653 27.5 22.9414 27.5 22.4994V16.666M22.5 11.666C22.7641 11.6654 23.0257 11.717 23.2697 11.818C23.5137 11.919 23.7353 12.0673 23.9217 12.2544L26.9117 15.2444C27.0987 15.4308 27.247 15.6523 27.348 15.8964C27.449 16.1404 27.5006 16.4019 27.5 16.666M22.5 11.666V15.8327C22.5 16.0537 22.5878 16.2657 22.7441 16.4219C22.9004 16.5782 23.1123 16.666 23.3333 16.666L27.5 16.666M14.1667 15.8328C13.7246 15.8328 13.3007 16.0084 12.9882 16.3209C12.6756 16.6335 12.5 17.0574 12.5 17.4994V26.6661C12.5 27.1081 12.6756 27.5321 12.9882 27.8446C13.3007 28.1572 13.7246 28.3328 14.1667 28.3328H20.8333C21.1259 28.3328 21.4133 28.2557 21.6666 28.1095C21.92 27.9632 22.1304 27.7528 22.2767 27.4994"
//                         stroke="#0B0B0B"
//                         stroke-width="1.4"
//                         stroke-linecap="round"
//                         stroke-linejoin="round"
//                     />
//                 </svg>
//             </Button> */}
//             <DrawerToggleButton className={clsx('drawer-toggle-button', isOpen && 'hidden')} />
//         </div>
//     );
// };
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
        <div className="flex flex-row flex-nowrap justify-space-between w-full p-2">
            <div className="flex flex-row flex-nowrap justify-start items-center mr-2 shrink-0 gap-1">
                <Button onClick={toggleSideMenu} icon shape="solid" color="weak" size="medium" className="shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                            d="M7.5 2.5V17.5M4.16667 2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5Z"
                            stroke="var(--button-default-text-color)"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
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
