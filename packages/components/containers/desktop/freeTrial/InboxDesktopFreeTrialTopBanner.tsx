import { differenceInDays, format, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { TopBanner } from '@proton/components';

import { freeTrialUpgradeClick } from './freeTrialUpgradeClick';
import useInboxFreeTrial, { FIRST_REMINDER_DAYS, SECOND_REMINDER_DAYS, THIRD_REMINDER_DAYS } from './useInboxFreeTrial';

const UpgradeButton = () => {
    return (
        <Button shape="underline" onClick={freeTrialUpgradeClick} className="py-0">{c('Action').t`Upgrade Now`}</Button>
    );
};

const getTopBannerMessage = (daysDifference: number, endDate: Date) => {
    const upgradeButton = <UpgradeButton key="upgrade-button" />;

    if (daysDifference === FIRST_REMINDER_DAYS) {
        const formattedEndDate = format(endDate, 'MMMM dd yyyy');
        return c('Action').jt`Your desktop app free trial ends on ${formattedEndDate}. ${upgradeButton}`;
    } else if (daysDifference === SECOND_REMINDER_DAYS) {
        return c('Action').jt`Your desktop app free trial ends in 5 days. ${upgradeButton}`;
    } else if (daysDifference === THIRD_REMINDER_DAYS) {
        return c('Action').jt`Your desktop app free trial ends in 2 days. ${upgradeButton}`;
    }

    return undefined;
};

const InboxDesktopFreeTrialTopBanner = () => {
    const { freeTrialDates, firstLogin, updateReminderFlag, displayReminder } = useInboxFreeTrial();
    const today = startOfDay(new Date());

    // Do not display if first reminder or no reminders to display
    if (firstLogin || !displayReminder) {
        return null;
    }
    // Do not display if the dates are missing
    else if (!freeTrialDates || !freeTrialDates.Value?.trialEndDate) {
        return null;
    }

    const endDate = startOfDay(new Date(freeTrialDates.Value.trialEndDate));
    const daysDifference = differenceInDays(endDate, today);
    const message = getTopBannerMessage(daysDifference, new Date(freeTrialDates.Value.trialEndDate));

    if (!message) {
        return null;
    }

    const handleClose = () => {
        updateReminderFlag({
            first: daysDifference <= FIRST_REMINDER_DAYS,
            second: daysDifference <= SECOND_REMINDER_DAYS,
            third: daysDifference <= THIRD_REMINDER_DAYS,
        });
    };

    return (
        <TopBanner onClose={handleClose} className="bg-info">
            {message}
        </TopBanner>
    );
};

export default InboxDesktopFreeTrialTopBanner;
