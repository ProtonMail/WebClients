import { useEffect, useState } from 'react';

import { addDays, isBefore, startOfDay } from 'date-fns';

import { FeatureCode, useFeature } from '@proton/features';
import type {
    InboxDesktopFreeTrialDates,
    InboxDesktopFreeTrialReminders,
} from '@proton/shared/lib/desktop/desktopTypes';

import { shouldDisplayReminder } from './shouldDisplayReminder';

export const DEFAULT_TRIAL_DAYS = 14;
export const FIRST_REMINDER_DAYS = 14;
export const SECOND_REMINDER_DAYS = 5;
export const THIRD_REMINDER_DAYS = 2;

const { InboxDesktopFreeTrialDates: DatesFlag, InboxDesktopFreeTrialReminders: RemindersFlag } = FeatureCode;

const useInboxFreeTrial = () => {
    const { feature: datesFlag, update: updateDates } = useFeature<InboxDesktopFreeTrialDates>(DatesFlag);
    const { feature: remindFlag, update: updateReminders } = useFeature<InboxDesktopFreeTrialReminders>(RemindersFlag);

    const [displayReminder, setDisplayReminder] = useState(false);

    useEffect(() => {
        if (datesFlag?.Value?.trialEndDate && remindFlag?.Value) {
            const shouldDisplay = shouldDisplayReminder(datesFlag.Value.trialEndDate, remindFlag.Value);
            setDisplayReminder(shouldDisplay);
        }
    }, [remindFlag, datesFlag]);

    const startFreeTrial = () => {
        const today = new Date();
        updateDates({
            trialStartDate: startOfDay(today),
            trialEndDate: startOfDay(addDays(today, DEFAULT_TRIAL_DAYS)),
        });

        updateReminders({
            first: false,
            second: false,
            third: false,
        });
    };

    const updateDatesFlag = (flag: InboxDesktopFreeTrialDates) => {
        updateDates(flag);
    };

    const updateReminderFlag = (flag: InboxDesktopFreeTrialReminders) => {
        updateReminders(flag);
    };

    const isUserInFreeTrial = () => {
        const today = new Date();
        return (
            datesFlag?.Value?.trialStartDate &&
            datesFlag.Value.trialEndDate &&
            isBefore(today, new Date(datesFlag.Value.trialEndDate))
        );
    };

    const firstLogin = datesFlag?.Value && !datesFlag.Value.trialEndDate && !datesFlag.Value.trialStartDate;

    const allReminderShown = remindFlag?.Value?.first && remindFlag?.Value?.second && remindFlag?.Value?.third;

    return {
        freeTrialDates: datesFlag,
        freeTrialReminders: remindFlag,
        updateDatesFlag,
        updateReminderFlag,
        startFreeTrial,
        displayReminder,
        firstLogin,
        allReminderShown,
        isUserInFreeTrial,
    };
};

export default useInboxFreeTrial;
