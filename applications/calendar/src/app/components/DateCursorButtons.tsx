import { useMemo } from 'react';
import { c } from 'ttag';
import { Icon, TodayIcon, ToolbarButton, ToolbarSeparator } from '@proton/components';
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
            <ToolbarButton
                className="flex-item-noshrink"
                title={todayTitle}
                onClick={onToday}
                icon={<TodayIcon todayDate={now.getDate()} />}
            >
                <span className="ml0-5 mtauto mbauto no-mobile">{c('Action').t`Today`}</span>
            </ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton
                data-test-id="calendar-toolbar:previous"
                title={previous}
                onClick={onPrev}
                icon={<Icon name="chevron-left" className="mauto toolbar-icon" />}
            >
                <span className="sr-only">{previous}</span>
            </ToolbarButton>
            <ToolbarButton
                data-test-id="calendar-toolbar:next"
                title={next}
                onClick={onNext}
                icon={<Icon name="chevron-right" className="mauto toolbar-icon" />}
            >
                <span className="sr-only">{next}</span>
            </ToolbarButton>
            <ToolbarSeparator />
            <span className="pl1 pr0-5 mtauto mbauto flex-item-noshrink">{currentRange}</span>
        </>
    );
};

export default DateCursorButtons;
