import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { useSidebarVisibility } from '../../layouts/sidebar/hooks/useSidebarVisibility';
import { applyRetentionPolicy } from '../../layouts/sidepanel/helpers';
import { getGroupAttentionKey, useAttentionKeys } from '../../providers/ConversationAttentionProvider';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { useRightPanel } from '../../providers/RightPanelProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { useLumoSelector } from '../../redux/hooks';
import type { LumoState } from '../../redux/store';
import { SpaceType } from '../../types';
import { NewChatButtonHeader } from '../Buttons/NewChatButton';
import { LumoIcon } from '../LumoIcon/LumoIcon';
import { AttentionDot } from '../StatusDot/AttentionDot';

import './Header.scss';

/**
 * Only badge the toggle if opening the sidebar can reveal the request.
 * The sidebar already keeps eligible pending entries beyond its section limits.
 */
function selectSidebarAttentionKey(
    { conversations, spaces, lumoUserSettings }: LumoState,
    {
        byConversation,
        hasLumoPlus,
        isSmallScreen,
        showSchedules,
    }: {
        byConversation: ReturnType<typeof useAttentionKeys>['byConversation'];
        hasLumoPlus: boolean;
        isSmallScreen: boolean;
        showSchedules: boolean;
    }
) {
    const eligible = [];
    for (const [id, key] of byConversation) {
        const conversation = conversations[id];
        // Seen requests have no dot key. Missing and ghost chats have no sidebar row.
        if (!key || !conversation || conversation.ghost) continue;

        const spaceType = spaces[conversation.spaceId]?.spaceType;
        if (spaceType === SpaceType.Schedule) {
            // Scheduled is the sidebar entry point for run chats.
            if (!showSchedules) continue;
        } else {
            // A run whose schedule is missing has no entry in any sidebar section.
            if (conversation.scheduleRun) continue;
            // On small screens Projects is a shortcut. A dot needs a row in Favorites or Recent.
            if (
                spaceType === SpaceType.Project &&
                isSmallScreen &&
                !conversation.starred &&
                !lumoUserSettings.showProjectConversationsInHistory
            ) {
                continue;
            }
        }
        eligible.push({ key, createdAt: conversation.createdAt });
    }

    // Use the chat lists' retention window even while expired conversations are still loaded.
    return getGroupAttentionKey(applyRetentionPolicy(eligible, hasLumoPlus).map(({ key }) => key));
}

const SidebarToggleButton = ({ className }: { className?: string }) => {
    const { toggle: toggleSideMenu, isVisible } = useSidebar();
    const { isGuest, isSmallScreen, showSchedules } = useSidebarVisibility();
    const { hasLumoPlus } = useLumoPlan();
    const { byConversation } = useAttentionKeys();

    const attentionKey = useLumoSelector((state) =>
        isGuest || isVisible
            ? undefined
            : selectSidebarAttentionKey(state, { byConversation, hasLumoPlus, isSmallScreen, showSchedules })
    );

    return (
        <Button
            onClick={toggleSideMenu}
            icon
            shape="ghost"
            color="weak"
            size="medium"
            className={clsx('sidebar-toggle-button shrink-0', className)}
        >
            <span className="sr-only">
                {isVisible ? c('collider_2025:Button').t`Close sidebar` : c('collider_2025:Action').t`Show sidebar`}
            </span>
            <span className={clsx('sidebar-toggle-icon relative flex', attentionKey && 'sidebar-toggle-icon--badged')}>
                <LumoIcon name="PanelLeft" size={20} />
                {attentionKey && (
                    <AttentionDot
                        attentionKey={`sidebar:${attentionKey}`}
                        className="sidebar-toggle-attention-dot"
                        variant="accent"
                        label={
                            // translator: Read out after "Show sidebar" when at least one chat in the hidden sidebar needs a response or approval.
                            c('collider_2025:Info').t`A chat needs your attention`
                        }
                    />
                )}
            </span>
        </Button>
    );
};

const DrawerToggleButton = ({ className }: { className?: string }) => {
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
