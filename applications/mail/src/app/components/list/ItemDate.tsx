import { useEffect, useMemo, useState } from 'react';

import { Tooltip } from '@proton/components';

import { getSnoozeTimeFromElement, isElementReminded } from 'proton-mail/logic/snoozehelpers';

import { formatDistanceToNow, formatFullDate, formatSimpleDate } from '../../helpers/date';
import { getDate } from '../../helpers/elements';
import { Element } from '../../models/element';
import ItemDateSnoozedMessage from './ItemDateSnoozedMessage';

const REFRESH_DATE_INTERVAL = 60 * 1000;

type FormaterType = 'simple' | 'full' | 'distance';

const FORMATTERS = {
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
    isInListView?: boolean;
}

const ItemDate = ({ element, labelID, className, mode = 'simple', useTooltip = false, isInListView }: Props) => {
    const formatter = FORMATTERS[mode];

    const [formattedDate, setFormattedDate] = useState(() => {
        const date = getDate(element, labelID);
        return date.getTime() === 0 ? '' : formatter(date);
    });

    const fullDate = useMemo(() => {
        const date = getDate(element, labelID);
        return date.getTime() === 0 ? '' : FORMATTERS.full(date);
    }, [element, labelID]);

    useEffect(() => {
        const date = getDate(element, labelID);

        if (date.getTime() === 0) {
            return;
        }

        const update = () => setFormattedDate(formatter(date));

        update();

        if (mode === 'distance' || mode === 'simple') {
            const intervalID = setInterval(update, REFRESH_DATE_INTERVAL);
            return () => clearInterval(intervalID);
        }
    }, [element, mode, labelID]);

    // Handles the snooze cases. A message can be snoozed or reminded and the ItemDateSnoozedMessage handle both cases.
    const snoozeTime = getSnoozeTimeFromElement(element);
    const isReminded = isElementReminded(element);
    if (isInListView && (snoozeTime || isReminded)) {
        return (
            <ItemDateSnoozedMessage
                element={element}
                labelID={labelID}
                className={className}
                snoozeTime={snoozeTime}
                useTooltip={useTooltip}
            />
        );
    }

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
