import { useState, useMemo, useEffect } from 'react';
import { c, msgid } from 'ttag';
import { useInterval, useHandler } from 'react-components';
import { fromUnixTime, isAfter, differenceInSeconds } from 'date-fns';

import { Element } from '../models/element';
import { EXPIRATION_CHECK_FREQUENCY } from '../constants';

export const formatDelay = (nowDate: Date, expirationDate: Date): string => {
    let delta = differenceInSeconds(expirationDate, nowDate);
    const daysCountLeft = Math.floor(delta / 86400);
    delta -= daysCountLeft * 86400;
    const hoursCountLeft = Math.floor(delta / 3600) % 24;
    delta -= hoursCountLeft * 3600;
    const minutesCountLeft = Math.floor(delta / 60) % 60;
    delta -= minutesCountLeft * 60;
    const secondsCountLeft = delta % 60;

    return [
        {
            diff: daysCountLeft,
            text: c('Time unit').ngettext(msgid`${daysCountLeft} day`, `${daysCountLeft} days`, daysCountLeft),
        },
        {
            diff: hoursCountLeft,
            text: c('Time unit').ngettext(msgid`${hoursCountLeft} hour`, `${hoursCountLeft} hours`, hoursCountLeft),
        },
        {
            diff: minutesCountLeft,
            text: c('Time unit').ngettext(
                msgid`${minutesCountLeft} minute`,
                `${minutesCountLeft} minutes`,
                minutesCountLeft
            ),
        },
        {
            diff: secondsCountLeft,
            text: c('Time unit').ngettext(
                msgid`${secondsCountLeft} second`,
                `${secondsCountLeft} seconds`,
                secondsCountLeft
            ),
        },
    ]
        .filter(({ diff }) => diff !== 0)
        .map(({ text }) => text)
        .join(', ');
};

export const useExpiration = ({ ExpirationTime }: Element): [boolean, string] => {
    const [delayMessage, setDelayMessage] = useState('');

    const expirationDate = useMemo(() => fromUnixTime(ExpirationTime || 0), [ExpirationTime]);

    const handler = useHandler(() => {
        if (!ExpirationTime) {
            setDelayMessage('');
            return;
        }

        const nowDate = new Date();

        if (isAfter(nowDate, expirationDate)) {
            setDelayMessage(c('Info').t`This message is expired!`);
            return;
        }
        const formattedDelay = formatDelay(nowDate, expirationDate);

        setDelayMessage(c('Info').t`This message will expire in ${formattedDelay}`);
    });

    useEffect(() => {
        handler();

        if (ExpirationTime) {
            const intervalID = window.setInterval(handler, 1000); // eslint-disable-line @typescript-eslint/no-implied-eval
            return () => clearInterval(intervalID);
        }
    }, [ExpirationTime]);

    return [delayMessage !== '', delayMessage];
};

export const useExpirationCheck = (elements: Element[], expiredCallback: (element: Element) => void) => {
    useInterval(EXPIRATION_CHECK_FREQUENCY, () => {
        const nowDate = new Date();
        elements.forEach((element) => {
            const { ExpirationTime } = element;
            if (ExpirationTime) {
                const expirationDate = fromUnixTime(ExpirationTime);
                if (isAfter(nowDate, expirationDate)) {
                    expiredCallback(element);
                }
            }
        });
    });
};
