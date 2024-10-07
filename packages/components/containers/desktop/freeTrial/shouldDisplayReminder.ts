import { differenceInDays, startOfDay } from 'date-fns';

import {
    FIRST_REMINDER_DAYS,
    SECOND_REMINDER_DAYS,
    THIRD_REMINDER_DAYS,
} from '@proton/components/containers/desktop/freeTrial/constants';
import type { InboxDesktopFreeTrialReminders } from '@proton/shared/lib/desktop/desktopTypes';

export const shouldDisplay = (
    today: Date,
    differenceToTest: number,
    expirationDay: Date,
    alreadyDisplayed?: boolean
) => {
    const endDate = new Date(expirationDay);
    const daysDifference = differenceInDays(endDate, today);
    return daysDifference === differenceToTest && !alreadyDisplayed;
};

export const shouldDisplayReminder = (trialEndDate: Date, remindFlag: InboxDesktopFreeTrialReminders) => {
    const startOfToday = startOfDay(new Date());

    const firstReminder = shouldDisplay(startOfToday, FIRST_REMINDER_DAYS, trialEndDate, remindFlag?.first);
    const secondReminder = shouldDisplay(startOfToday, SECOND_REMINDER_DAYS, trialEndDate, remindFlag?.second);
    const thirdReminder = shouldDisplay(startOfToday, THIRD_REMINDER_DAYS, trialEndDate, remindFlag?.third);

    return firstReminder || secondReminder || thirdReminder;
};
