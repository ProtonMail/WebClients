import { useMemo } from 'react';
import { c } from 'ttag';
import { Icon } from '@proton/components';
import { format } from 'date-fns';
import { dateLocale } from '@proton/shared/lib/i18n';

import { VIEWS } from '@proton/shared/lib/calendar/constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA, CUSTOM } = VIEWS;

interface Props {
    view: VIEWS;
    now: Date;
    onToday: () => void;
    onPrev: () => void;
    onNext: () => void;
    currentRange: string;
}
const DateCursorButtons = ({ view, now, onToday, onPrev, onNext, currentRange }: Props) => {
    const todayTitle = useMemo(() => {
        return format(now, 'PP', { locale: dateLocale });
    }, [now, dateLocale]);

    const previous = {
        [DAY]: c('Action').t`Previous day`,
        [WEEK]: c('Action').t`Previous week`,
        [MONTH]: c('Action').t`Previous month`,
        [AGENDA]: c('Action').t`Previous month`,
        [CUSTOM]: c('Action').t`Previous month`,
        [YEAR]: c('Action').t`Previous year`,
    }[view];

    const next = {
        [DAY]: c('Action').t`Next day`,
        [WEEK]: c('Action').t`Next week`,
        [MONTH]: c('Action').t`Next month`,
        [AGENDA]: c('Action').t`Next month`,
        [CUSTOM]: c('Action').t`Next month`,
        [YEAR]: c('Action').t`Next year`,
    }[view];

    return (
        <>
            <button
                type="button"
                data-test-id="calendar-toolbar:today"
                className="toolbar-button color-inherit flex-item-noshrink"
                title={todayTitle}
                onClick={onToday}
            >
                <Icon name="calendar-today" className="flex-item-noshrink mtauto mbauto toolbar-icon" />
                <span className="ml0-5 mtauto mbauto no-mobile">{c('Action').t`Today`}</span>
            </button>
            <span className="toolbar-separator flex-item-noshrink" />
            <button
                type="button"
                data-test-id="calendar-toolbar:previous"
                className="toolbar-button flex-item-noshrink on-rtl-mirror"
                title={previous}
                onClick={onPrev}
            >
                <Icon name="chevron-left" className="mauto toolbar-icon" />
                <span className="sr-only">{previous}</span>
            </button>
            <button
                type="button"
                data-test-id="calendar-toolbar:next"
                className="toolbar-button flex-item-noshrink on-rtl-mirror"
                title={next}
                onClick={onNext}
            >
                <Icon name="chevron-right" className="mauto toolbar-icon" />
                <span className="sr-only">{next}</span>
            </button>
            <span className="toolbar-separator flex-item-noshrink" />
            <span className="pl1 pr0-5 mtauto mbauto flex-item-noshrink">{currentRange}</span>
        </>
    );
};

export default DateCursorButtons;
