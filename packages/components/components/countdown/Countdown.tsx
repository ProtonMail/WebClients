import { useEffect, useState } from 'react';
import { isBefore, differenceInMilliseconds } from 'date-fns';
import { DAY, HOUR, MINUTE, SECOND } from '@proton/shared/lib/constants';

const EVERY_SECOND = SECOND;

interface RenderInjection {
    diff: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
}

interface Props {
    start?: Date;
    end: Date;
    render: (injection: RenderInjection) => JSX.Element;
}

const Countdown = ({ start, end, render }: Props) => {
    const [now, setNow] = useState(() => new Date());

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

    const diff = differenceInMilliseconds(end, now);
    const expired = diff < 0;
    const absoluteDiff = Math.abs(diff);
    const days = Math.floor(absoluteDiff / DAY);
    const hours = Math.floor((absoluteDiff % DAY) / HOUR);
    const minutes = Math.floor((absoluteDiff % HOUR) / MINUTE);
    const seconds = Math.floor((absoluteDiff % MINUTE) / SECOND);

    return render({ expired, diff, days, hours, minutes, seconds });
};

export default Countdown;
