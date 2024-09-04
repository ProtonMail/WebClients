import { useMemo } from 'react';

import { addDays, startOfDay } from 'date-fns';

import { useFeature, useUser } from '@proton/components/hooks';
import type {
    InboxDesktopFreeTrialDates,
    InboxDesktopFreeTrialReminders,
} from '@proton/shared/lib/desktop/desktopTypes';

import { FeatureCode } from '../../features';
import { shouldDisplayReminder as checkShouldDisplayReminder } from './shouldDisplayReminder';

export const DEFAULT_TRIAL_DAYS = 14;
export const FIRST_REMINDER_DAYS = 14;
export const SECOND_REMINDER_DAYS = 5;
export const THIRD_REMINDER_DAYS = 2;

const { InboxDesktopFreeTrialDates: DatesFlag, InboxDesktopFreeTrialReminders: RemindersFlag } = FeatureCode;

const useInboxFreeTrial = () => {
    const [user] = useUser();
    const { feature: datesFlag, update: updateDates } = useFeature<InboxDesktopFreeTrialDates>(DatesFlag);
    const { feature: remindFlag, update: updateReminders } = useFeature<InboxDesktopFreeTrialReminders>(RemindersFlag);

    const shouldDisplayReminder = useMemo(() => {
        if (user.hasPaidMail || !user.canPay) {
            return false;
        }

        if (datesFlag?.Value.trialEndDate && remindFlag?.Value) {
            return checkShouldDisplayReminder(datesFlag.Value.trialEndDate, remindFlag.Value);
        }

        return false;
    }, [user, remindFlag, datesFlag]);

    const startFreeTrial = () => {
        const today = new Date();
        void updateDates({
            trialStartDate: startOfDay(today),
            trialEndDate: startOfDay(addDays(today, DEFAULT_TRIAL_DAYS)),
        });

        void updateReminders({
            first: false,
            second: false,
            third: false,
        });
    };

    const updateReminderFlag = (flag: InboxDesktopFreeTrialReminders) => {
        void updateReminders(flag);
    };

    const firstLogin = !!(datesFlag && !datesFlag.Value.trialEndDate && !datesFlag.Value.trialStartDate);

    return {
        shouldShowTrialDialog: firstLogin && !user.hasPaidMail && user.canPay,
        shouldAutoStartFreeTrial: firstLogin && !user.hasPaidMail && !user.canPay,
        freeTrialDates: datesFlag,
        startFreeTrial,
        updateReminderFlag,
        shouldDisplayReminder,
    };
};

export default useInboxFreeTrial;
