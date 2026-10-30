import { useMemo } from 'react';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoSelector } from '../../redux/hooks';
import type { Message, SpaceId } from '../../types';
import { SpaceType } from '../../types';
import { NativeNotificationPermissionBanner } from '../Notifications/NativeNotificationPermissionBanner';

interface ComposerNativeNotificationPermissionBannerProps {
    /** Messages in the current conversation, including saved schedule responses. */
    messageChain: Message[];
    /** Space containing the current conversation. */
    spaceId?: SpaceId;
}

export const ComposerNativeNotificationPermissionBanner = ({
    messageChain,
    spaceId,
}: ComposerNativeNotificationPermissionBannerProps) => {
    const { schedules } = useLumoFlags();
    const spaces = useLumoSelector((state) => state.spaces);

    const hasNotifyingSchedule = useMemo(() => {
        if (!schedules) return false;
        const space = spaceId ? spaces[spaceId] : undefined;
        const isNotifyingScheduledRun = space?.spaceType === SpaceType.Schedule && space.schedule.notifyOnComplete;
        const hasNotifyingSavedSchedule = messageChain.some(({ createScheduleToolResponse: response }) => {
            if (!response?.scheduleId || response.cancelled) return false;
            const scheduleSpace = spaces[response.scheduleId];
            return scheduleSpace?.spaceType === SpaceType.Schedule && scheduleSpace.schedule.notifyOnComplete;
        });
        return isNotifyingScheduledRun || hasNotifyingSavedSchedule;
    }, [messageChain, schedules, spaceId, spaces]);

    if (!hasNotifyingSchedule) return null;

    return <NativeNotificationPermissionBanner className="mx-1.5" key={messageChain[0]?.conversationId} dismissible />;
};
