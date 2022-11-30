import { useEffect, useState } from 'react';

import { MINUTE } from '@proton/shared/lib/constants';

interface Props {
    onChangeMonthDay?: () => void;
}

const useDynamicMonthDay = ({ onChangeMonthDay }: Props = {}) => {
    const [monthDay, setMonthDay] = useState(new Date().getDate());

    useEffect(() => {
        onChangeMonthDay?.();

        const interval = setInterval(() => {
            const monthDayNow = new Date().getDate();

            if (monthDayNow !== monthDay) {
                setMonthDay(monthDayNow);
            }
        }, MINUTE);

        return () => {
            clearInterval(interval);
        };
    }, [monthDay]);

    return monthDay;
};

export default useDynamicMonthDay;
