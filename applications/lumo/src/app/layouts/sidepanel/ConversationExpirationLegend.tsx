import { useMemo } from 'react';

import { c, msgid } from 'ttag';

import { IcClock } from '@proton/icons/icons/IcClock';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';

import { useLumoPlan } from '../../hooks/useLumoPlan';
import type { Conversation } from '../../types';
import { countConversationsByExpirationUrgency } from './helpers';

interface ConversationExpirationLegendProps {
    conversations: Conversation[];
}

const getUrgentLegendLabel = (expiringInOneDay: number, expiringToday: number): string => {
    const urgentTotal = expiringInOneDay + expiringToday;

    if (expiringToday > 0 && expiringInOneDay > 0) {
        return c('collider_2025: Info').ngettext(
            msgid`${urgentTotal} chat will expire within 24 hours`,
            `${urgentTotal} chats will expire within 24 hours`,
            urgentTotal
        );
    }

    if (expiringToday > 0) {
        return c('collider_2025: Info').ngettext(
            msgid`${expiringToday} chat will expire today`,
            `${expiringToday} chats will expire today`,
            expiringToday
        );
    }

    return c('collider_2025: Info').ngettext(
        msgid`${expiringInOneDay} chat will expire in 1 day`,
        `${expiringInOneDay} chats will expire in 1 day`,
        expiringInOneDay
    );
};

export const ConversationExpirationLegend = ({ conversations }: ConversationExpirationLegendProps) => {
    const { hasLumoPlus } = useLumoPlan();

    const { expiringInTwoDays, expiringInOneDay, expiringToday } = useMemo(
        () => countConversationsByExpirationUrgency(conversations),
        [conversations]
    );

    const urgentTotal = expiringInOneDay + expiringToday;

    if (hasLumoPlus || (expiringInTwoDays === 0 && urgentTotal === 0)) {
        return null;
    }

    return (
        <div className="conversation-expiration-legend flex flex-column gap-1 mb-3 text-sm color-weak">
            {expiringInTwoDays > 0 && (
                <div className="flex items-center gap-1.5">
                    <IcClock size={4} className="color-weak shrink-0" alt="" />
                    <span>
                        {c('collider_2025: Info').ngettext(
                            msgid`${expiringInTwoDays} chat will expire in 2 days`,
                            `${expiringInTwoDays} chats will expire in 2 days`,
                            expiringInTwoDays
                        )}
                    </span>
                </div>
            )}
            {urgentTotal > 0 && (
                <div className="flex items-center gap-1.5">
                    <IcHourglass size={4} className="color-weak shrink-0" alt="" />
                    <span>{getUrgentLegendLabel(expiringInOneDay, expiringToday)}</span>
                </div>
            )}
        </div>
    );
};
