import { useState, useMemo } from 'react';
import { c } from 'ttag';
import { fromUnixTime, isAfter, differenceInSeconds } from 'date-fns';

import { Element } from '../models/element';
import { useInterval } from './useHandler';
import { EXPIRATION_CHECK_FREQUENCY } from '../constants';

export const formatDelay = (nowDate: Date, expirationDate: Date): string => {
    let delta = differenceInSeconds(expirationDate, nowDate);
    const days = Math.floor(delta / 86400);
    delta -= days * 86400;
    const hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;
    const minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;
    const seconds = delta % 60;
    return [
        {
            diff: days,
            unit: c('Time unit').t`day`,
            units: c('Time unit').t`days`
        },
        {
            diff: hours,
            unit: c('Time unit').t`hour`,
            units: c('Time unit').t`hours`
        },
        {
            diff: minutes,
            unit: c('Time unit').t`minute`,
            units: c('Time unit').t`minutes`
        },
        {
            diff: seconds,
            unit: c('Time unit').t`second`,
            units: c('Time unit').t`seconds`
        }
    ]
        .reduce((acc: string[], { diff, unit, units }: { diff: number; unit: string; units: string }) => {
            if (diff) {
                acc.push(diff === 1 ? `${diff} ${unit}` : `${diff} ${units}`);
            }
            return acc;
        }, [])
        .join(', ');
};

export const useExpiration = ({ ExpirationTime }: Element): [boolean, string] => {
    const [delayMessage, setDelayMessage] = useState('');

    const expirationDate = useMemo(() => fromUnixTime(ExpirationTime || 0), []);

    const abort = useInterval(ExpirationTime ? 1000 : 0, () => {
        const nowDate = new Date();

        if (isAfter(nowDate, expirationDate)) {
            setDelayMessage(c('Info').t`This message is expired!`);
            abort();
            return;
        }

        setDelayMessage(c('Info').t`This message will expire in ${formatDelay(nowDate, expirationDate)}`);
    });

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
