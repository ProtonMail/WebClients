import { differenceInDays, fromUnixTime } from 'date-fns';

import { domIsBusy } from '@proton/shared/lib/busy';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    protonConfig: ProtonConfig;
    lastReminderTimestamp?: number;
    isVisited: boolean;
}

const ACCOUNT_AGE_DAY_THESHOLD = 14;
const REMINDER_INTERVAL_DAYS = 90;

const isEligible = ({ user, protonConfig, lastReminderTimestamp, isVisited }: Props) => {
    const { isFree, isDelinquent, CreateTime } = user;
    const isNotDelinquent = !isDelinquent;
    const hasValidApp = protonConfig.APP_NAME === APPS.PROTONMAIL;

    const today = new Date();
    const daysSinceAccountCreation = differenceInDays(today, fromUnixTime(CreateTime));
    const lastReminderDate = lastReminderTimestamp ? fromUnixTime(lastReminderTimestamp) : daysSinceAccountCreation;
    const daysSinceLastReminder = differenceInDays(today, lastReminderDate);

    // We display the reminder every 90 days (three month)
    const displaySixMonthReminder =
        daysSinceAccountCreation >= REMINDER_INTERVAL_DAYS && daysSinceLastReminder >= REMINDER_INTERVAL_DAYS;
    // We display the initial reminder after 14 days if the user hasn't seend the offer yet
    const isAccountOlderThanInitialTheshold = !isVisited && daysSinceAccountCreation >= ACCOUNT_AGE_DAY_THESHOLD;

    const isDomBusy = domIsBusy();

    return (
        isFree &&
        isNotDelinquent &&
        hasValidApp &&
        (isAccountOlderThanInitialTheshold || displaySixMonthReminder) &&
        !isDomBusy
    );
};

export default isEligible;
