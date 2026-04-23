import { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useAssetsLimitStatus, useMessagesLimitStatus } from '../../hooks/useResourceLimitStatus';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { setNativeGhostMode } from '../../remote/nativeComposerBridgeHelpers';
import type { ConversationId, SpaceId } from '../../types';
import { ComposerNotificationCard, type NotificationSeverity } from '../Notifications/ComposerNotificationCard';
import {IcExclamationCircle} from "@proton/icons/icons/IcExclamationCircle";
import {getIsMobileDevice} from "../../util/device";

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
 * Inline banner shown above the composer when the current conversation or
 * project is near / at a backend-enforced limit (messages per conversation,
 * files per project). Mirrors the visual layout of the "Liking Lumo?" CTA
 * block via the shared `ComposerNotificationCard`.
 */
export const ComposerLimitBanner = ({ conversationId, spaceId, onOpenFiles }: Props) => {
    const history = useHistory();
    const { setGhostChatMode } = useGhostChat();
    const isMobile = getIsMobileDevice();

    const messagesStatus = useMessagesLimitStatus(conversationId);
    const assetsStatus = useAssetsLimitStatus(spaceId);

    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const startNewChat = useCallback(() => {
        setGhostChatMode(false);
        setNativeGhostMode(false);
        history.push('/');
    }, [history, setGhostChatMode]);

    const banner: BannerConfig | null = useMemo(() => {
        if (messagesStatus.isAtLimit) {
            return {
                key: `messages-at-${conversationId ?? 'none'}`,
                severity: 'error',
                dismissible: false,
                title: c('collider_2025: Warning').t`Message limit reached`,
                description: c('collider_2025: Warning')
                    .t`You've hit the ${messagesStatus.limit}-message limit in this conversation. Start a new chat to keep talking with ${LUMO_SHORT_APP_NAME}.`,
                action: { label: c('collider_2025: Action').t`Start new chat`, onClick: startNewChat },
            };
        }
        if (assetsStatus.isAtLimit) {
            return {
                key: `assets-at-${spaceId ?? 'none'}`,
                severity: 'error',
                dismissible: false,
                title: c('collider_2025: Warning').t`File limit reached`,
                description: c('collider_2025: Warning')
                    .t`You've hit the ${assetsStatus.limit}-file limit in this project. Remove some files before uploading new ones.`,
                action: onOpenFiles
                    ? { label: c('collider_2025: Action').t`Manage files`, onClick: onOpenFiles }
                    : undefined,
            };
        }
        if (messagesStatus.isApproaching) {
            const remaining = messagesStatus.remaining;
            return {
                key: `messages-approaching-${conversationId ?? 'none'}`,
                severity: 'warning',
                dismissible: true,
                title: c('collider_2025: Warning').t`Approaching message limit`,
                description: c('collider_2025: Warning')
                    .t`You have ${remaining} messages left in this conversation. Start a new chat for best responses.`,
                action: { label: c('collider_2025: Action').t`Start new chat`, onClick: startNewChat },
            };
        }
        if (assetsStatus.isApproaching) {
            const remaining = assetsStatus.remaining;
            return {
                key: `assets-approaching-${spaceId ?? 'none'}`,
                severity: 'warning',
                dismissible: true,
                title: c('collider_2025: Warning').t`Approaching file limit`,
                description: c('collider_2025: Warning')
                    .t`You have ${remaining} file uploads left in this project.`,
                action: onOpenFiles
                    ? { label: c('collider_2025: Action').t`Manage files`, onClick: onOpenFiles }
                    : undefined,
            };
        }
        return null;
    }, [messagesStatus, assetsStatus, conversationId, spaceId, startNewChat, onOpenFiles]);

    // Mobile has a dedicated native composer, so this inline banner would
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
            icon={<IcExclamationCircle />}
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
