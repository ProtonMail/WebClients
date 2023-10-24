import { useMemo } from 'react';

import { format, isToday, isTomorrow } from 'date-fns';
import { c } from 'ttag';

import { Icon, Tooltip } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { formatFullDate, formatScheduledTimeString } from 'proton-mail/helpers/date';
import { getIsElementReminded } from 'proton-mail/logic/snoozehelpers';
import { Element } from 'proton-mail/models/element';

interface Props {
    snoozeTime: number;
    className?: string;
    useTooltip?: boolean;
}

const SnoozedDate = ({ snoozeTime, className, useTooltip = false }: Props) => {
    const snoozeDate = new Date(snoozeTime * 1000);
    const snoozeShortDate = useMemo(() => {
        const formattedDate = formatScheduledTimeString(snoozeDate);
        if (isToday(snoozeDate)) {
            // translator: Indicates that the message will be unsnoozed today. Example: Snoozed until today, 12:00 PM
            return c('Info').t`Snoozed until today, ${formattedDate}`;
        }

        if (isTomorrow(snoozeDate)) {
            // translator: Indicates that the message will be unsnoozed tomorrow. Example: Snoozed until tomorrow, 12:00 PM
            return c('Info').t`Snoozed until tomorrow, ${formattedDate}`;
        }

        return format(snoozeDate, 'iii, MMM dd, p ', { locale: dateLocale });
    }, [snoozeDate]);

    const fullDate = formatFullDate(snoozeDate);

    const itemDate = (
        <>
            <time
                dateTime={fullDate}
                className={clsx(className, 'color-warning')}
                title={useTooltip ? undefined : fullDate}
                aria-hidden="true"
                data-testid="item-date-snoozed"
            >
                {snoozeShortDate}
            </time>
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

const RemindedConversation = ({ className }: { className?: string }) => {
    return (
        <span className={clsx(className, 'color-warning flex flex-align-items-center')}>
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

    const isReminded = getIsElementReminded(element);
    if (snoozeTime && labelID !== MAILBOX_LABEL_IDS.INBOX && !isReminded) {
        return <SnoozedDate snoozeTime={snoozeTime} className={className} useTooltip={useTooltip} />;
    } else if (isReminded) {
        return <RemindedConversation className={className} />;
    }

    return null;
};

export default ItemDateSnoozeMessage;
