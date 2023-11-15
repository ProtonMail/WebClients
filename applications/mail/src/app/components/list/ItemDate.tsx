import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { formatDistanceToNow, formatFullDate, formatSimpleDate } from '../../helpers/date';
import { getDate } from '../../helpers/elements';
import { params } from '../../logic/elements/elementsSelectors';
import { getSnoozeTimeFromElement, isElementReminded, isElementSnoozed } from '../../logic/snoozehelpers';
import { Element } from '../../models/element';
import ItemDateRender from './ItemDateRender';
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

    const { conversationMode } = useSelector(params);

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

    // Displays the orange date when the element has a snooze label
    // Displays the orange "Reminded" text when the element has DisplaySnoozedReminder
    const snoozeTime = getSnoozeTimeFromElement(element);
    const isReminded = isElementReminded(element);
    const isSnoozed = isElementSnoozed(element, conversationMode);

    if (isInListView && (isReminded || (isSnoozed && snoozeTime))) {
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

    return (
        <ItemDateRender
            className={className}
            useTooltip={useTooltip}
            formattedDate={formattedDate}
            fullDate={fullDate}
            dataTestId={`item-date-${mode}`}
        />
    );
};

export default ItemDate;
