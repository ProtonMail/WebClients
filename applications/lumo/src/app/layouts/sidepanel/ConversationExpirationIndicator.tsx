import { useMemo } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import type { Conversation } from '../../types';
import {
    getConversationExpirationTooltip,
    getConversationExpirationUrgency,
    getConversationRetentionDaysRemaining,
} from './helpers';

interface ConversationExpirationIndicatorProps {
    conversation: Conversation;
    className?: string;
}

export const ConversationExpirationIndicator = ({ conversation, className }: ConversationExpirationIndicatorProps) => {
    const { hasLumoPlus } = useLumoPlan();

    const { urgency, tooltip } = useMemo(() => {
        if (hasLumoPlus) {
            return { urgency: null, tooltip: '' };
        }

        const nextUrgency = getConversationExpirationUrgency(conversation);

        if (!nextUrgency) {
            return { urgency: null, tooltip: '' };
        }

        const daysRemaining = getConversationRetentionDaysRemaining(conversation);

        return {
            urgency: nextUrgency,
            tooltip: getConversationExpirationTooltip(daysRemaining),
        };
    }, [conversation, hasLumoPlus]);

    if (!urgency) {
        return null;
    }

    const iconAlt =
        urgency === 'urgent'
            ? c('collider_2025: Info').t`Chat expiring very soon`
            : c('collider_2025: Info').t`Chat expiring soon`;

    return (
        <Tooltip title={tooltip}>
            <span
                className={clsx('conversation-expiration-indicator relative z-1 shrink-0 flex items-center', className)}
                aria-label={tooltip}
            >
                {urgency === 'urgent' ? (
                    <LumoIcon name="Hourglass" size={16} className="color-warning" aria-label={iconAlt} />
                ) : (
                    <LumoIcon name="Clock" size={16} className="color-warning" aria-label={iconAlt} />
                )}
            </span>
        </Tooltip>
    );
};
