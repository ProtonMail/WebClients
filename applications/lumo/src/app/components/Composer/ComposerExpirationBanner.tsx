import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { useLumoPlan } from '../../hooks/useLumoPlan';
import {
    getConversationExpirationBannerTitle,
    getConversationExpirationUrgency,
    getConversationRetentionDaysRemaining,
} from '../../layouts/sidepanel/helpers';
import { useLumoSelector } from '../../redux/hooks';
import { selectConversationById } from '../../redux/selectors';
import type { ConversationId } from '../../types';
import InlineUpsell from '../../upsells/primitives/InlineUpsell';
import useLumoPlusUpsellButtonConfig from '../../upsells/useLumoPlusUpsellButtonConfig';
import { getIsMobileDevice } from '../../util/device';
import { LumoIcon } from '../LumoIcon/LumoIcon';
import { ComposerNotificationCard } from '../Notifications/ComposerNotificationCard';

interface Props {
    conversationId?: ConversationId;
}

const getDismissStorageKey = (conversationId: ConversationId, daysRemaining: number) =>
    `lumo-chat-expiration-banner-${conversationId}-${daysRemaining}`;

const isBannerDismissed = (key: string) => sessionStorage.getItem(key) === '1';

const getExpirationBannerDescription = (
    canShowTalkToAdminLumoUpsell: boolean,
    upsellConfig: ReturnType<typeof useLumoPlusUpsellButtonConfig>
): React.ReactNode => {
    if (canShowTalkToAdminLumoUpsell) {
        return c('collider_2025: Info')
            .t`Free accounts keep chat history for 7 days. Talk to your admin to keep this chat.`;
    }

    if (upsellConfig) {
        return (
            <span>
                {c('collider_2025: Info').t`Free accounts keep chat history for 7 days. `}
                <InlineUpsell
                    path={upsellConfig.path}
                    onUpgrade={upsellConfig.onUpgrade}
                    callToActionText={upsellConfig.getChatCTAContent()}
                    className={upsellConfig.className}
                />
            </span>
        );
    }

    return c('collider_2025: Info').t`Free accounts keep chat history for 7 days from when a chat was created.`;
};

/**
 * Inline banner shown above the composer when a free user's conversation is
 * within the chat history retention window.
 */
export const ComposerExpirationBanner = ({ conversationId }: Props) => {
    const { hasLumoPlus, canShowTalkToAdminLumoUpsell } = useLumoPlan();
    const upsellConfig = useLumoPlusUpsellButtonConfig(LUMO_UPSELL_PATHS.CHAT_HISTORY);
    const conversation = useLumoSelector((state) =>
        conversationId ? selectConversationById(conversationId)(state) : undefined
    );
    const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => new Set());

    const banner = useMemo(() => {
        if (!conversationId || !conversation || hasLumoPlus) {
            return null;
        }

        const urgency = getConversationExpirationUrgency(conversation);

        if (!urgency) {
            return null;
        }

        const daysRemaining = getConversationRetentionDaysRemaining(conversation);

        return {
            dismissKey: getDismissStorageKey(conversationId, daysRemaining),
            daysRemaining,
            title: getConversationExpirationBannerTitle(daysRemaining),
            severity: urgency === 'urgent' ? ('warning' as const) : ('info' as const),
            urgency,
        };
    }, [conversationId, conversation, hasLumoPlus]);

    const handleDismiss = useCallback(() => {
        if (!banner) {
            return;
        }

        sessionStorage.setItem(banner.dismissKey, '1');
        setDismissedKeys((previous) => new Set(previous).add(banner.dismissKey));
    }, [banner]);

    if (
        getIsMobileDevice() ||
        !banner ||
        isBannerDismissed(banner.dismissKey) ||
        dismissedKeys.has(banner.dismissKey)
    ) {
        return null;
    }

    const description = getExpirationBannerDescription(canShowTalkToAdminLumoUpsell, upsellConfig);

    return (
        <ComposerNotificationCard
            icon={
                banner.urgency === 'urgent' ? (
                    <LumoIcon name="Hourglass" size={16} className="color-weak" />
                ) : (
                    <LumoIcon name="Clock" size={16} className="color-weak" />
                )
            }
            title={banner.title}
            description={description}
            severity={banner.severity}
            dismissible
            onDismiss={handleDismiss}
        />
    );
};

export default ComposerExpirationBanner;
