import { useEffect, useState } from 'react';
import { isCyberMonday } from 'proton-shared/lib/helpers/blackfriday';

const EVERY_MINUTE = 60 * 1000;

const useCyberMondayPeriod = () => {
    const [cyberMonday, setCyberMonday] = useState(isCyberMonday());

    useEffect(() => {
        const intervalID = setInterval(() => {
            setCyberMonday(isCyberMonday());
        }, EVERY_MINUTE);

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    return cyberMonday;
};

export default useCyberMondayPeriod;
