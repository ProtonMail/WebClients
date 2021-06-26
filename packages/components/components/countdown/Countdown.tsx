import React, { useEffect, useState } from 'react';
import { c, msgid } from 'ttag';
import { DAY, HOUR, MINUTE, SECOND } from 'proton-shared/lib/constants';
import { isBefore, isAfter, differenceInMilliseconds } from 'date-fns';

const EVERY_SECOND = SECOND;

interface Props {
    start?: Date;
    end: Date;
    separator?: string;
}

const Countdown = ({ start, end, separator = ' | ' }: Props) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const intervalID = setInterval(() => {
            setNow(new Date());
        }, EVERY_SECOND);

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    if (start && isBefore(now, start)) {
        return null;
    }

    if (isAfter(now, end)) {
        return <>{c('Countdown status').t`Expired`}</>;
    }

    const diff = differenceInMilliseconds(end, now);
    const days = Math.floor(diff / DAY);
    const hours = Math.floor((diff % DAY) / HOUR);
    const minutes = Math.floor((diff % HOUR) / MINUTE);
    const seconds = Math.floor((diff % MINUTE) / SECOND);

    return (
        <>
            {[
                c('Countdown unit').ngettext(msgid`${days} day`, `${days} days`, days),
                c('Countdown unit').ngettext(msgid`${hours} hour`, `${hours} hours`, hours),
                c('Countdown unit').ngettext(msgid`${minutes} minute`, `${minutes} minutes`, minutes),
                c('Countdown unit').ngettext(msgid`${seconds} second`, `${seconds} seconds`, seconds),
            ].join(separator)}
        </>
    );
};

export default Countdown;
