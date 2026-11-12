import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useLumoSelector } from '../../redux/hooks';
import { selectSchedules } from '../../redux/selectors';
import { getScheduleLimit } from './scheduleEntitlements';

export type ScheduleLimitModalState = {
    scheduleLimit: number;
    upgradePath: 'checkout' | 'admin' | 'none';
};

export function useScheduleLimit() {
    const plan = useLumoPlan();
    const { isLumoPlanLoading } = plan;
    const schedules = useLumoSelector(selectSchedules);
    const { createNotification } = useNotifications();
    const scheduleLimitModal = useModalStateObject();

    const scheduleCount = Object.keys(schedules).length;
    const scheduleLimit = getScheduleLimit(plan);

    let upgradePath: ScheduleLimitModalState['upgradePath'] = 'none';
    if (plan.canShowLumoUpsellFree || plan.canShowLumoUpsellB2C || plan.canShowLumoUpsellB2B) {
        upgradePath = 'checkout';
    } else if (plan.canShowTalkToAdminLumoUpsell && !plan.hasLumoPlus) {
        upgradePath = 'admin';
    }

    const canCreateSchedule = !isLumoPlanLoading && scheduleCount < scheduleLimit;

    const checkCanCreateSchedule = () => {
        if (canCreateSchedule) return true;

        if (isLumoPlanLoading) {
            // translator: Notification when creating or saving a new scheduled task is blocked while subscription details are loading.
            const message = c('collider_2025:Info').t`Checking your plan, try again in a moment.`;
            createNotification({ text: message });
            return false;
        }

        scheduleLimitModal.openModal(true);
        return false;
    };

    return {
        checkCanCreateSchedule,
        scheduleLimitModal,
        scheduleLimitModalState: {
            scheduleLimit,
            upgradePath,
        } satisfies ScheduleLimitModalState,
    };
}
