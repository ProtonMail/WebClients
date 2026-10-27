import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useLumoSelector } from '../../redux/hooks';
import { selectSchedules } from '../../redux/selectors';

export function useScheduleLimit() {
    const { hasLumoPlus, isLumoPlanLoading } = useLumoPlan();
    const schedules = useLumoSelector(selectSchedules);
    const { createNotification } = useNotifications();
    const scheduleLimitModal = useModalStateObject();

    const scheduleCount = Object.keys(schedules).length;
    const scheduleLimit = hasLumoPlus ? 3 : 1;
    const canCreateSchedule = !isLumoPlanLoading && scheduleCount < scheduleLimit;

    const checkCanCreateSchedule = () => {
        if (canCreateSchedule) return true;

        if (isLumoPlanLoading) {
            // translator: Notification when creating or saving a new scheduled task is blocked while subscription details are loading.
            const message = c('collider_2025:Info').t`Checking your plan, try again in a moment.`;
            createNotification({ text: message });
            return false;
        }

        if (!hasLumoPlus) {
            scheduleLimitModal.openModal(true);
            return false;
        }

        // translator: Shown when creating a scheduled task at the plan limit. ${scheduleLimit} is the maximum number of scheduled tasks allowed by the user's plan.
        const message = c('collider_2025:Error')
            .t`You've reached your plan's scheduled task limit (${scheduleLimit}). Delete a task to create another.`;
        createNotification({ type: 'error', text: message });
        return false;
    };

    return { checkCanCreateSchedule, scheduleLimitModal };
}
