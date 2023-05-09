import { useMemo } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { Vr } from '@proton/atoms';
import { Icon, TodayIcon, ToolbarButton } from '@proton/components';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { dateLocale } from '@proton/shared/lib/i18n';

import { getNavigationArrowsText } from '../helpers/i18n';

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

    const { previous, next } = getNavigationArrowsText(view);

    return (
        <>
            <ToolbarButton
                data-testid="calendar-toolbar:today"
                className="flex-item-noshrink"
                title={todayTitle}
                onClick={onToday}
                icon={<TodayIcon todayDate={now.getDate()} />}
            >
                <span className="ml-2 my-auto no-mobile">{c('Action').t`Today`}</span>
            </ToolbarButton>
            <Vr />
            <ToolbarButton
                data-testid="calendar-toolbar:previous"
                title={previous}
                onClick={onPrev}
                icon={<Icon name="chevron-left" className="m-auto toolbar-icon" />}
            >
                <span className="sr-only">{previous}</span>
            </ToolbarButton>
            <ToolbarButton
                data-testid="calendar-toolbar:next"
                title={next}
                onClick={onNext}
                icon={<Icon name="chevron-right" className="m-auto toolbar-icon" />}
            >
                <span className="sr-only">{next}</span>
            </ToolbarButton>
            <Vr />
            <span
                className="pr-2 my-auto flex-item-noshrink on-tablet-flex-shrink text-ellipsis block"
                title={currentRange}
            >
                {currentRange}
            </span>
        </>
    );
};

export default DateCursorButtons;
