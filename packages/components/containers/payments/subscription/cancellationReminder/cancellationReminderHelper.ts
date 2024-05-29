import { Feature } from '@proton/features/interface';
import { SubscriptionModel } from '@proton/shared/lib/interfaces';

export type ReminderFlag = Record<string, number>;

const showReminder = 1 as const;
const reminderShowed = 2 as const;

export const markRemindersAsSeen = (feature: ReminderFlag): ReminderFlag => {
    return Object.entries(feature).reduce((newFeature, [key, value]) => {
        newFeature[key] = value === showReminder ? reminderShowed : value;
        return newFeature;
    }, {} as ReminderFlag);
};

export const shouldDisplayReminder = (feature: ReminderFlag): boolean => {
    return Object.values(feature).some((value) => value === showReminder);
};

export const shouldOpenReminderModal = (
    subscriptionLoading: boolean,
    subscription?: SubscriptionModel,
    feature?: Feature<ReminderFlag>
) => {
    if (!feature?.Value || subscriptionLoading) {
        return false;
    }

    const currentValue = feature.Value;
    const newShouldDisplay = shouldDisplayReminder(currentValue);
    return newShouldDisplay && !subscriptionLoading && !!subscription?.PeriodEnd;
};
