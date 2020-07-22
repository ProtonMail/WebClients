import React, { useState, useEffect } from 'react';

import { getDate } from '../../helpers/elements';
import { formatSimpleDate, formatFullDate, formatDistanceToNow } from '../../helpers/date';
import { Element } from '../../models/element';

const REFRESH_DATE_INTERVAL = 1000;

type FormaterType = 'simple' | 'full' | 'distance';

const FORMATERS = {
    simple: formatSimpleDate,
    full: formatFullDate,
    distance: formatDistanceToNow
};

interface Props {
    element: Element | undefined;
    labelID: string;
    className?: string;
    mode?: FormaterType;
}

const ItemDate = ({ element, labelID, className, mode = 'simple' }: Props) => {
    const formater = FORMATERS[mode] || FORMATERS.distance;

    const [formattedDate, setFormattedDate] = useState(() => {
        const date = getDate(element, labelID);
        return date.getTime() === 0 ? '' : formater(date);
    });

    useEffect(() => {
        const date = getDate(element, labelID);

        if (date.getTime() === 0) {
            return;
        }

        const update = () => setFormattedDate(formater(date));

        update();

        if (mode === 'distance') {
            const intervalID = setInterval(update, REFRESH_DATE_INTERVAL);
            return () => clearInterval(intervalID);
        }
    }, [element, mode]);

    return <span className={className}>{formattedDate}</span>;
};

export default ItemDate;
