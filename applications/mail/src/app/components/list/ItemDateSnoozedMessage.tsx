import { useMemo } from 'react';

import { isToday, isTomorrow } from 'date-fns';
import { c } from 'ttag';

import { Icon } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { formatDateToHuman, formatFullDate, formatSimpleDate } from '../../helpers/date';
import { isElementReminded } from '../../logic/snoozehelpers';
import { Element } from '../../models/element';
import ItemDateRender from './ItemDateRender';

import './ItemDateSnoozedMessage.scss';

interface Props {
    snoozeDate: Date;
    className?: string;
    useTooltip?: boolean;
}

const SnoozedDate = ({ snoozeDate, className, useTooltip = false }: Props) => {
    const snoozeShortDate = useMemo(() => {
        const { formattedTime } = formatDateToHuman(snoozeDate);
        const dateString = formatSimpleDate(snoozeDate);

        if (isToday(snoozeDate)) {
            return formattedTime;
        }
        if (isTomorrow(snoozeDate)) {
            return c('Info').t`Tomorrow, ${formattedTime}`;
        }

        return `${dateString}, ${formattedTime}`;
    }, [snoozeDate]);

    const fullDate = formatFullDate(snoozeDate);

    return (
        <ItemDateRender
            className={clsx(className, 'item-date-snoozed')}
            useTooltip={useTooltip}
            fullDate={fullDate}
            formattedDate={snoozeShortDate}
            dataTestId="item-date-snoozed"
        />
    );
};

const RemindedConversation = ({ className, snoozeDate }: { className?: string; snoozeDate: Date }) => {
    const snoozeTime = useMemo(() => {
        if (isToday(snoozeDate)) {
            return format(snoozeDate, 'p', { locale: dateLocale });
        }

        return format(snoozeDate, 'MMM dd', { locale: dateLocale });
    }, [snoozeDate]);

    return (
        <span
            className={clsx(className, 'item-date-snoozed flex flex-align-items-center')}
            data-testid="item-date-reminded"
        >
            <Icon name="bell" className="mr-1" />
            <span>{snoozeTime}</span>
        </span>
    );
};

const ItemDateSnoozeMessage = ({
    element,
    labelID,
    snoozeTime,
    useTooltip,
    className,
}: {
    element?: Element;
    labelID: string;
    useTooltip: boolean;
    snoozeTime?: number;
    className?: string;
}) => {
    if (!element) {
        return null;
    }

    const isReminded = isElementReminded(element);
    const snoozeDate = snoozeTime ? new Date(snoozeTime * 1000) : undefined;
    if (!snoozeDate) {
        return null;
    }

    if (snoozeTime && labelID !== MAILBOX_LABEL_IDS.INBOX && !isReminded) {
        return <SnoozedDate snoozeDate={snoozeDate} className={className} useTooltip={useTooltip} />;
    } else if (isReminded) {
        return <RemindedConversation className={className} snoozeDate={snoozeDate} />;
    }

    return null;
};

export default ItemDateSnoozeMessage;
