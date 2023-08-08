import { useEffect, useMemo, useState } from 'react';

import { Tooltip } from '@proton/components';

import { formatDistanceToNow, formatFullDate, formatSimpleDate } from '../../helpers/date';
import { getDate } from '../../helpers/elements';
import { Element } from '../../models/element';

const REFRESH_DATE_INTERVAL = 60 * 1000;

type FormaterType = 'simple' | 'full' | 'distance';

const FORMATERS = {
    simple: formatSimpleDate,
    full: formatFullDate,
    distance: formatDistanceToNow,
};

interface Props {
    element: Element | undefined;
    labelID: string;
    className?: string;
    mode?: FormaterType;
    useTooltip?: boolean;
}

const ItemDate = ({ element, labelID, className, mode = 'simple', useTooltip = false }: Props) => {
    const formater = FORMATERS[mode];

    const [formattedDate, setFormattedDate] = useState(() => {
        const date = getDate(element, labelID);
        return date.getTime() === 0 ? '' : formater(date);
    });

    const fullDate = useMemo(() => {
        const date = getDate(element, labelID);
        return date.getTime() === 0 ? '' : FORMATERS.full(date);
    }, [element, labelID]);

    useEffect(() => {
        const date = getDate(element, labelID);

        if (date.getTime() === 0) {
            return;
        }

        const update = () => setFormattedDate(formater(date));

        update();

        if (mode === 'distance' || mode === 'simple') {
            const intervalID = setInterval(update, REFRESH_DATE_INTERVAL);
            return () => clearInterval(intervalID);
        }
    }, [element, mode, labelID]);

    const itemDate = (
        <>
            <span
                className={className}
                title={useTooltip ? undefined : fullDate}
                aria-hidden="true"
                data-testid={`item-date-${mode}`}
            >
                {formattedDate}
            </span>
            <span className="sr-only">{fullDate}</span>
        </>
    );

    if (useTooltip) {
        return (
            <Tooltip title={fullDate}>
                <span>{itemDate}</span>
            </Tooltip>
        );
    }

    return <>{itemDate}</>;
};

export default ItemDate;
