import { useMemo } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { Button, Vr } from '@proton/atoms';
import { Icon, ToolbarButton } from '@proton/components';
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
            <span className="md:hidden current-range my-auto block text-bold text-ellipsis" title={currentRange}>
                {currentRange}
            </span>
            <span className="flex flex-nowrap ml-auto md:ml-0">
                <span className="md:hidden flex-item-noshrink flex flex-nowrap">
                    <ToolbarButton
                        data-testid="calendar-toolbar:today"
                        className="flex-item-noshrink flex-align-items-centers"
                        title={todayTitle}
                        onClick={onToday}
                    >
                        <Icon name="calendar-today" />
                    </ToolbarButton>
                </span>
                <Vr className="mx-1 md:hidden" />
                <Button
                    shape="outline"
                    data-testid="calendar-toolbar:today"
                    className="flex-item-noshrink no-mobile mr-2"
                    title={todayTitle}
                    onClick={onToday}
                >
                    {c('Action').t`Today`}
                </Button>
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
                <span
                    className="no-mobile current-range ml-2 my-auto block text-bold text-xl text-ellipsis"
                    title={currentRange}
                >
                    {currentRange}
                </span>
            </span>
        </>
    );
};

export default DateCursorButtons;
