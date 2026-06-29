import { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { useAssetsLimitStatus, useMessagesLimitStatus } from '../../hooks/useResourceLimitStatus';
import { useTierErrors } from '../../hooks/useTierErrors';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { shouldShowWeeklyLimitUpsell, useRemainingLimits } from '../../services/usageLimitsStore';
import type { ConversationId, SpaceId } from '../../types';
import { getIsMobileDevice } from '../../util/device';
import { LumoIcon } from '../LumoIcon/LumoIcon';
import { ComposerNotificationCard, type NotificationSeverity } from '../Notifications/ComposerNotificationCard';
import InlineUpsell from '../../upsells/primitives/InlineUpsell';
import useLumoPlusUpsellButtonConfig from '../../upsells/useLumoPlusUpsellButtonConfig';

interface Props {
    conversationId?: ConversationId;
    spaceId?: SpaceId;
    onOpenFiles?: () => void;
}

type BannerConfig = {
    key: string;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
    severity: NotificationSeverity;
    dismissible: boolean;
};

/**
 * Inline banner shown above the composer when the user hits a limit: weekly chat
 * quota, conversation length, or project file count.
 */
export const ComposerLimitBanner = ({ conversationId, spaceId, onOpenFiles }: Props) => {
    const history = useHistory();
    const { setGhostChatMode } = useGhostChat();
    const isMobile = getIsMobileDevice();
    const isGuest = useIsGuest();
    const { hasLumoPlus, canShowTalkToAdminLumoUpsell } = useLumoPlan();
    const { hasTierErrors } = useTierErrors();
    const remainingLimits = useRemainingLimits();
    const upsellConfig = useLumoPlusUpsellButtonConfig(LUMO_UPSELL_PATHS.QUESTION_LIMIT_FREE);
    const showWeeklyLimitBanner = shouldShowWeeklyLimitUpsell(remainingLimits, hasTierErrors, hasLumoPlus);

    const messagesStatus = useMessagesLimitStatus(conversationId);
    const assetsStatus = useAssetsLimitStatus(spaceId);

    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const canShowMessageLimit = Boolean(conversationId);

    const startNewChat = useCallback(() => {
        setGhostChatMode(false);
        history.push('/');
    }, [history, setGhostChatMode]);

    const weeklyLimitMessage = useMemo(() => {
        if (!showWeeklyLimitBanner) {
            return null;
        }

        if (isGuest) {
            return c('collider_2025: Info')
                .jt`You've run out of weekly chats, please sign in or create an account to have higher limits.`;
        }

        if (canShowTalkToAdminLumoUpsell) {
            return c('collider_2025: Info')
                .t`You've run out of weekly chats. Contact your admin to get higher limits.`;
        }

        if (upsellConfig) {
            return (
                <>
                    {c('collider_2025: Info').t`You've run out of weekly chats, please `}
                    <InlineUpsell
                        path={upsellConfig.path}
                        onUpgrade={upsellConfig.onUpgrade}
                        callToActionText={c('collider_2025: Link').t`upgrade`}
                        className={upsellConfig.className}
                    />
                    {c('collider_2025: Info').t` to have higher limits.`}
                </>
            );
        }

        return c('collider_2025: Info')
            .t`You've run out of weekly chats, please upgrade to have higher limits.`;
    }, [showWeeklyLimitBanner, isGuest, canShowTalkToAdminLumoUpsell, upsellConfig]);

    const banner: BannerConfig | null = useMemo(() => {
        if (canShowMessageLimit && messagesStatus.isAtLimit) {
            return {
                key: `messages-at-${conversationId ?? 'none'}`,
                severity: 'error',
                dismissible: false,
                title: c('collider_2025: Warning').t`Conversation too long`,
                description: c('collider_2025: Warning')
                    .t`This conversation is too long to continue. Start a new chat to keep ${LUMO_SHORT_APP_NAME} purring and responsive.`,
                action: { label: c('collider_2025: Action').t`Start new chat`, onClick: startNewChat },
            };
        }
        if (assetsStatus.isAtLimit) {
            return {
                key: `assets-at-${spaceId ?? 'none'}`,
                severity: 'error',
                dismissible: false,
                title: c('collider_2025: Warning').t`Too many files to juggle`,
                description: c('collider_2025: Warning')
                    .t`That's a lot of files for ${LUMO_SHORT_APP_NAME} to juggle. Remove some before uploading new ones to keep things purring.`,
                action: onOpenFiles
                    ? { label: c('collider_2025: Action').t`Manage files`, onClick: onOpenFiles }
                    : undefined,
            };
        }
        if (canShowMessageLimit && messagesStatus.isApproaching) {
            return {
                key: `messages-approaching-${conversationId ?? 'none'}`,
                severity: 'warning',
                dismissible: true,
                title: c('collider_2025: Warning').t`This conversation is getting long`,
                description: c('collider_2025: Warning')
                    .t`Long conversations can slow down responses. Start a new chat to keep ${LUMO_SHORT_APP_NAME} purring.`,
                action: { label: c('collider_2025: Action').t`Start new chat`, onClick: startNewChat },
            };
        }
        if (assetsStatus.isApproaching) {
            return {
                key: `assets-approaching-${spaceId ?? 'none'}`,
                severity: 'warning',
                dismissible: true,
                title: c('collider_2025: Warning').t`This project is filling up`,
                description: c('collider_2025: Warning')
                    .t`Tidying away files you no longer need keeps ${LUMO_SHORT_APP_NAME} purring.`,
                action: onOpenFiles
                    ? { label: c('collider_2025: Action').t`Manage files`, onClick: onOpenFiles }
                    : undefined,
            };
        }
        return null;
    }, [messagesStatus, assetsStatus, canShowMessageLimit, conversationId, spaceId, startNewChat, onOpenFiles]);

    if (weeklyLimitMessage) {
        return (
            <p className="composer-limit-banner-message m-0 mb-2 text-sm color-weak text-center text-wrap-balance">
                {weeklyLimitMessage}
            </p>
        );
    }

    // Mobile has a dedicated native composer, so resource-limit cards would
    // render in the wrong place. The resource-limit toast (wired up in
    // `useResourceLimitNotifications`) still fires on 422 responses.
    if (isMobile) {
        return null;
    }

    if (!banner || dismissed.has(banner.key)) {
        return null;
    }

    const handleDismiss = () => setDismissed((prev) => new Set(prev).add(banner.key));

    return (
        <ComposerNotificationCard
            icon={<LumoIcon name="Info" />}
            title={banner.title}
            description={banner.description}
            action={banner.action}
            severity={banner.severity}
            dismissible={banner.dismissible}
            onDismiss={handleDismiss}
        />
    );
};

export default ComposerLimitBanner;
