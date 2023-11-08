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
    snoozeTime: number;
    className?: string;
    useTooltip?: boolean;
}

const SnoozedDate = ({ snoozeTime, className, useTooltip = false }: Props) => {
    const snoozeDate = new Date(snoozeTime * 1000);
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

const RemindedConversation = ({ className }: { className?: string }) => {
    return (
        <span className={clsx(className, 'item-date-snoozed flex flex-align-items-center')}>
            <Icon name="bell" className="mr-1" />
            <span className="">{c('Snooze').t`Reminded`}</span>
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
    if (snoozeTime && labelID !== MAILBOX_LABEL_IDS.INBOX && !isReminded) {
        return <SnoozedDate snoozeTime={snoozeTime} className={className} useTooltip={useTooltip} />;
    } else if (isReminded) {
        return <RemindedConversation className={className} />;
    }

    return null;
};

export default ItemDateSnoozeMessage;
