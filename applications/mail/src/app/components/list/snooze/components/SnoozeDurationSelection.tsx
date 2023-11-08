import { MouseEvent } from 'react';

import { addDays, differenceInDays, format, nextMonday, nextSaturday, set } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useUser, useUserSettings } from '@proton/components/hooks';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { SETTINGS_WEEK_START } from '@proton/shared/lib/interfaces';
import plusLogo from '@proton/styles/assets/img/illustrations/mail-plus-logo.svg';
import clsx from '@proton/utils/clsx';

import { formatSimpleDate } from '../../../../helpers/date';
import { SNOOZE_DURATION } from '../../../../hooks/actions/useSnooze';
import SnoozeHeader from './SnoozeHeader';

interface Props {
    canUnsnooze: boolean;
    handleUnsnoozeClick: (event: MouseEvent) => void;
    handleCustomClick: (event: MouseEvent) => void;
    handleSnooze: (event: MouseEvent, duration: SNOOZE_DURATION) => void;
}

interface ButtonProps {
    duration?: SNOOZE_DURATION;
    onClick: (event: MouseEvent, duration?: SNOOZE_DURATION) => void;
    leftText: string;
    rightText?: string;
    showUpsellButton?: boolean;
}

const { SATURDAY, SUNDAY } = SETTINGS_WEEK_START;
const getShortDayText = (day: SETTINGS_WEEK_START, formatTime: string) => {
    switch (day) {
        case SATURDAY:
            // translator: formatTime will always be at 9:00 AM. Will display "Sat, 9:00 AM" (if 12 hours is set) or "Sat, 09:00" (if 24 hours is set)
            return c('WeekDay').t`Sat, ${formatTime}`;
        case SUNDAY:
            // translator: formatTime will always be at 9:00 AM. Will display "Sun, 9:00 AM" (if 12 hours is set) or "Sun, 09:00" (if 24 hours is set)
            return c('WeekDay').t`Sun, ${formatTime}`;
        default:
            // translator: formatTime will always be at 9:00 AM. Will display "Mon, 9:00 AM" (if 12 hours is set) or "Mon, 09:00" (if 24 hours is set)
            return c('WeekDay').t`Mon, ${formatTime}`;
    }
};

const SnoozeButton = ({ onClick, duration, leftText, rightText, showUpsellButton }: ButtonProps) => (
    <Button
        fullWidth
        shape="ghost"
        data-testid={`snooze-duration-${duration}`}
        className={clsx('flex rounded-none', showUpsellButton ? 'gap-2' : 'flex-justify-space-between md:gap-10 ')}
        onClick={(e) => onClick(e, duration)}
    >
        <span>{leftText}</span>
        {rightText && <span className="color-weak">{rightText}</span>}

        {showUpsellButton && (
            <span>
                <img src={plusLogo} alt={c('Info').t`Upgrade to ${MAIL_APP_NAME} Plus to unlock`} />
            </span>
        )}
    </Button>
);

const SnoozeDurationSelection = ({ canUnsnooze, handleUnsnoozeClick, handleSnooze, handleCustomClick }: Props) => {
    const [{ hasPaidMail }] = useUser();
    const [{ WeekStart }] = useUserSettings();
    const weekStartInWeekend = [SATURDAY, SUNDAY].includes(WeekStart);

    const today = new Date();

    const nextMon = nextMonday(today);
    const nextSat = nextSaturday(today);
    const daysUntilNextMon = differenceInDays(nextMon, today);
    const daysUntilNextSat = differenceInDays(nextSat, today);
    const formattedDayOfWeek = format(addDays(today, 2), 'EEE');

    const time = set(today, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
    const formatTime = formatSimpleDate(time);
    const nextWeekShortDay = getShortDayText(WeekStart, formatTime);

    const dropdownOptions: { leftText: string; rightText: string; duration: SNOOZE_DURATION; visible: boolean }[] = [
        {
            leftText: c('Action').t`Tomorrow`,
            rightText: formatTime,
            duration: 'tomorrow',
            visible: true,
        },
        {
            leftText: c('Action').t`Later this week`,
            // translator: Shows the day of week and the time, e.g. "Mon, 9:00", "Fri, 9:00 AM" (if 12 hours is set)
            rightText: `${formattedDayOfWeek}, ${formatTime}`,
            duration: 'later',
            visible: daysUntilNextMon > 2 && daysUntilNextSat !== 2,
        },
        {
            leftText: c('Action').t`This weekend`,
            // translator: This will always be saturday at 9:00, will display "Sat, 9:00 AM" (if 12 hours is set) or "Sat, 09:00" (if 24 hours is set)
            rightText: c('Info').t`Sat, ${formatTime}`,
            duration: 'weekend',
            visible: !weekStartInWeekend && daysUntilNextMon > 2 && daysUntilNextSat !== 1,
        },
        {
            leftText: c('Action').t`Next week`,
            // translator: This will always be at 9:00 AM but can be monday, saturday or sunday depending on user settings. Will display "Mon, 9:00 AM" (if 12 hours is set) or "Mon, 09:00" (if 24 hours is set)
            rightText: nextWeekShortDay,
            duration: 'nextweek',
            visible: daysUntilNextMon > 1,
        },
    ];

    return (
        <>
            <SnoozeHeader headerClasses="px-4 pt-2" />
            <hr className="my-2" />
            <div className="flex gap-2">
                {dropdownOptions
                    .filter((item) => item.visible)
                    .map(({ duration, leftText, rightText }) => (
                        <SnoozeButton
                            key={duration}
                            leftText={leftText}
                            rightText={rightText}
                            duration={duration}
                            onClick={(e, duration) => {
                                if (e && duration) {
                                    handleSnooze(e, duration);
                                }
                            }}
                        />
                    ))}
            </div>
            <hr className="my-2" />
            <div className="mb-2">
                <SnoozeButton
                    key="custom"
                    duration="custom"
                    leftText={c('Action').t`Select date and time`}
                    onClick={handleCustomClick}
                    showUpsellButton={!hasPaidMail}
                />
            </div>
            {canUnsnooze && (
                <>
                    <hr className="my-2" />
                    <div className="mb-2">
                        <Button
                            key="unsnooze"
                            fullWidth
                            shape="ghost"
                            data-testid="snooze-duration-unsnooze"
                            className="flex rounded-none flex-justify-space-between md:gap-10"
                            onClick={handleUnsnoozeClick}
                        >
                            {c('Action').t`Unsnooze`}
                        </Button>
                    </div>
                </>
            )}
        </>
    );
};

export default SnoozeDurationSelection;
