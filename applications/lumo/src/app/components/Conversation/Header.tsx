import { clsx } from 'clsx';

import { Button } from '@proton/atoms/Button/Button';

import { useRightPanel } from '../../providers/RightPanelProvider';
import { useSidebar } from '../../providers/SidebarProvider';

import './Header.scss';

export const DrawerToggleButton = ({ className }: { className?: string }) => {
    const { toggle } = useRightPanel();
    return (
        <Button onClick={toggle} icon shape="ghost" color="weak" size="small" className={className}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="12" fill="#F5F6FE" />
                <path
                    d="M22.5 11.666H19.1667C18.7246 11.666 18.3007 11.8416 17.9882 12.1542C17.6756 12.4667 17.5 12.8907 17.5 13.3327V22.4994C17.5 22.9414 17.6756 23.3653 17.9882 23.6779C18.3007 23.9904 18.7246 24.166 19.1667 24.166H25.8333C26.2754 24.166 26.6993 23.9904 27.0118 23.6779C27.3244 23.3653 27.5 22.9414 27.5 22.4994V16.666M22.5 11.666C22.7641 11.6654 23.0257 11.717 23.2697 11.818C23.5137 11.919 23.7353 12.0673 23.9217 12.2544L26.9117 15.2444C27.0987 15.4308 27.247 15.6523 27.348 15.8964C27.449 16.1404 27.5006 16.4019 27.5 16.666M22.5 11.666V15.8327C22.5 16.0537 22.5878 16.2657 22.7441 16.4219C22.9004 16.5782 23.1123 16.666 23.3333 16.666L27.5 16.666M14.1667 15.8328C13.7246 15.8328 13.3007 16.0084 12.9882 16.3209C12.6756 16.6335 12.5 17.0574 12.5 17.4994V26.6661C12.5 27.1081 12.6756 27.5321 12.9882 27.8446C13.3007 28.1572 13.7246 28.3328 14.1667 28.3328H20.8333C21.1259 28.3328 21.4133 28.2557 21.6666 28.1095C21.92 27.9632 22.1304 27.7528 22.2767 27.4994"
                    stroke="#0B0B0B"
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
}: {
    children: React.ReactNode;
    withoutDrawerToggle?: boolean;
    leftHeaderButton?: React.ReactNode;
}) => {
    const { isOpen } = useRightPanel();
    const { toggle: toggleSideMenu } = useSidebar();
    return (
        <div className="flex flex-row flex-nowrap justify-space-between w-full">
            <div className="flex flex-row flex-nowrap justify-start items-center gap-2 mr-2 shrink-0">
                <Button onClick={toggleSideMenu} icon shape="ghost" color="weak" size="small" className="shrink-0">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="12" fill="#F5F6FE" />
                        <path
                            d="M17.5 12.5V27.5M14.1667 12.5H25.8333C26.7538 12.5 27.5 13.2462 27.5 14.1667V25.8333C27.5 26.7538 26.7538 27.5 25.8333 27.5H14.1667C13.2462 27.5 12.5 26.7538 12.5 25.8333V14.1667C12.5 13.2462 13.2462 12.5 14.1667 12.5Z"
                            stroke="#0B0B0B"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </Button>
                {leftHeaderButton}
            </div>
            {children}
            <DrawerToggleButton
                className={clsx('drawer-toggle-button', withoutDrawerToggle && 'visibility-hidden', isOpen && 'hidden')}
            />
        </div>
    );
};
