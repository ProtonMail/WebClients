import { useMemo } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Vr } from '@proton/atoms/Vr/Vr';
import ToolbarButton from '@proton/components/components/toolbar/ToolbarButton';
import { IcCalendarToday } from '@proton/icons/icons/IcCalendarToday';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import type { VIEWS } from '@proton/shared/lib/calendar/constants';
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [now, dateLocale]);

    const { previous, next } = getNavigationArrowsText(view);

    return (
        <>
            <span className="md:hidden current-range my-auto block text-bold text-ellipsis" title={currentRange}>
                {currentRange}
            </span>
            <span className="flex flex-nowrap ml-auto md:ml-0">
                <span className="md:hidden shrink-0 flex flex-nowrap">
                    <ToolbarButton
                        data-testid="calendar-toolbar:today"
                        className="shrink-0 items-centers"
                        title={todayTitle}
                        onClick={onToday}
                    >
                        <IcCalendarToday alt={c('Action').t`Today`} />
                    </ToolbarButton>
                </span>
                <Vr className="mx-1 md:hidden" />
                <Button
                    shape="outline"
                    data-testid="calendar-toolbar:today"
                    className="shrink-0 hidden md:inline-flex mr-2"
                    title={todayTitle}
                    onClick={onToday}
                >
                    {c('Action').t`Today`}
                </Button>
                <ToolbarButton
                    data-testid="calendar-toolbar:previous"
                    title={previous}
                    onClick={onPrev}
                    icon={<IcChevronLeft className="m-auto toolbar-icon" />}
                >
                    <span className="sr-only">{previous}</span>
                </ToolbarButton>
                <ToolbarButton
                    data-testid="calendar-toolbar:next"
                    title={next}
                    onClick={onNext}
                    icon={<IcChevronRight className="m-auto toolbar-icon" />}
                >
                    <span className="sr-only">{next}</span>
                </ToolbarButton>
                <h2
                    className="hidden md:block current-range ml-2 my-auto text-bold text-xl text-ellipsis"
                    title={currentRange}
                >
                    {currentRange}
                </h2>
            </span>
        </>
    );
};

export default DateCursorButtons;
