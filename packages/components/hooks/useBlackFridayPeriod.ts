import { useEffect, useState } from 'react';
import { isBlackFridayPeriod } from '@proton/shared/lib/helpers/blackfriday';

const EVERY_MINUTE = 60 * 1000;

const useBlackFridayPeriod = () => {
    const [blackFriday, setBlackFriday] = useState(isBlackFridayPeriod());

    useEffect(() => {
        const intervalID = setInterval(() => {
            setBlackFriday(isBlackFridayPeriod());
        }, EVERY_MINUTE);

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    return blackFriday;
};

export default useBlackFridayPeriod;
