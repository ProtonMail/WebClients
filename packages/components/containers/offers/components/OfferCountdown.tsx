import { fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import useDateCountdown from '@proton/hooks/useDateCountdown';
import isTruthy from '@proton/utils/isTruthy';

interface Props {
    periodEnd: number;
}

const Countdown = ({ periodEnd }: Props) => {
    const endDate = fromUnixTime(periodEnd);
    const countdownProps = useDateCountdown(endDate);
    const { expired, seconds, minutes, hours, days } = countdownProps;

    if (expired) {
        return null;
    }

    return (
        <div className="mt1 text-center">
            {[
                days > 0
                    ? c('specialoffer: Countdown unit').ngettext(msgid`${days} day`, `${days} days`, days)
                    : undefined,
                c('specialoffer: Countdown unit').ngettext(msgid`${hours} hour`, `${hours} hours`, hours),
                c('specialoffer: Countdown unit').ngettext(msgid`${minutes} minute`, `${minutes} minutes`, minutes),
                c('specialoffer: Countdown unit').ngettext(msgid`${seconds} second`, `${seconds} seconds`, seconds),
            ]
                .filter(isTruthy)
                .map((value) => {
                    const [number, unit] = value.split(' ');
                    return (
                        <span className="inline-flex flex-column flex-nowrap flex-align-items-center mr1" key={unit}>
                            <span className="bg-weak text-bold w2e offer-countdown-number py0-25 rounded">
                                {number}
                            </span>
                            <span className="text-nowrap color-weak">{unit}</span>
                        </span>
                    );
                })}
        </div>
    );
};

export default Countdown;
