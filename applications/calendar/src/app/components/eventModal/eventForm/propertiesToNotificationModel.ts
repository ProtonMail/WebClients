import generateUID from '@proton/atoms/generateUID';
import { filterFutureNotifications, sortNotificationsByAscendingTrigger } from '@proton/shared/lib/calendar/alarms';
import { triggerToModel } from '@proton/shared/lib/calendar/alarms/notificationModel';
import { ICAL_ALARM_ACTION, NOTIFICATION_TYPE_API } from '@proton/shared/lib/calendar/constants';
import { getSupportedAlarmAction } from '@proton/shared/lib/calendar/icsSurgery/valarm';
import { getIsAlarmComponent } from '@proton/shared/lib/calendar/vcalHelper';
import type { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import unary from '@proton/utils/unary';

export const propertiesToNotificationModel = (
    { components = [] }: Partial<VcalVeventComponent> = {},
    isAllDay: boolean
): NotificationModel[] => {
    const modelNotifications = components.filter(unary(getIsAlarmComponent)).map(({ trigger, action }) => {
        const type =
            getSupportedAlarmAction(action).value === ICAL_ALARM_ACTION.EMAIL
                ? NOTIFICATION_TYPE_API.EMAIL
                : NOTIFICATION_TYPE_API.DEVICE;

        return {
            id: generateUID('notification'),
            ...triggerToModel({
                trigger: trigger ? trigger.value : {},
                type,
                isAllDay,
            }),
        };
    });
    // Filter out future alarms
    return sortNotificationsByAscendingTrigger(filterFutureNotifications(modelNotifications));
};
