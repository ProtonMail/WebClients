import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import Commander from '@proton/components/components/commander/Commander';
import type { CommanderItemInterface } from '@proton/components/components/commander/Commander';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import CalendarShortcutsModal from '@proton/components/containers/calendar/shortcutsModal/CalendarShortcutsModal';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import type { AttendeeModel } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';

import useCalendarHotkeys from '../../hooks/useCalendarHotkeys';
import { useBookings } from '../bookings/bookingsProvider/BookingsProvider';

interface Props {
    onClickToday: () => void;
    onClickNextView: () => void;
    onClickPreviousView: () => void;
    onChangeView: (view: VIEWS) => void;
    onClickSearch: () => void;
    onCreateEvent?: (attendees?: AttendeeModel[]) => void;
    isDrawerApp: boolean;
}

const CalendarShortcutsAndCommander = ({
    isDrawerApp,
    onClickToday,
    onClickNextView,
    onClickPreviousView,
    onChangeView,
    onClickSearch,
    onCreateEvent,
}: Props) => {
    const documentRef = useRef<Document>(document);
    const [commanderModalProps, showCommander, commanderRender] = useModalState();
    const [shortcutModalProps, showShortcutModal, shortcutModalRender] = useModalState();

    const { isBookingActive } = useBookings();

    useCalendarHotkeys({
        isDrawerApp,
        showCommander,
        elementRef: documentRef,
        createEvent: () => {
            onCreateEvent?.();
        },
        goToToday: () => {
            onClickToday();
        },
        goToNextView: () => {
            onClickNextView?.();
        },
        goToPreviousView: () => {
            onClickPreviousView?.();
        },
        showDayView: () => {
            onChangeView(VIEWS.DAY);
        },
        showWeekView: () => {
            onChangeView(VIEWS.WEEK);
        },
        showMonthView: () => {
            onChangeView(VIEWS.MONTH);
        },
        focusSearchBar: () => {
            onClickSearch();
        },
        openShortcutModal: () => {
            showShortcutModal(true);
        },
    });

    const commanderList = useMemo<CommanderItemInterface[]>(
        () =>
            [
                onCreateEvent && {
                    icon: 'plus-circle',
                    label: c('Commander action').t`New event`,
                    value: 'create-event',
                    action: () => {
                        onCreateEvent();
                    },
                    shortcuts: ['N'],
                },
                {
                    icon: 'calendar-today',
                    label: c('Commander action').t`Today`,
                    value: 'move-to-today',
                    action: () => {
                        onClickToday();
                    },
                    shortcuts: ['T'],
                },
                {
                    icon: 'calendar-day',
                    label: c('Commander action').t`Day view`,
                    value: 'show-day-view',
                    action: () => {
                        onChangeView(VIEWS.DAY);
                    },
                    shortcuts: ['1'],
                },
                {
                    icon: 'calendar-week',
                    label: c('Commander action').t`Week view`,
                    value: 'show-week-view',
                    action: () => {
                        onChangeView(VIEWS.WEEK);
                    },
                    shortcuts: ['2'],
                },
                {
                    icon: 'calendar-month',
                    label: c('Commander action').t`Month view`,
                    value: 'show-month-view',
                    action: () => {
                        onChangeView(VIEWS.MONTH);
                    },
                    shortcuts: ['3'],
                },
                {
                    icon: 'arrow-right',
                    label: c('Commander action').t`Next period`,
                    value: 'go-to-next-view',
                    action: () => {
                        onClickNextView();
                    },
                    shortcuts: ['→'],
                },
                {
                    icon: 'arrow-left',
                    label: c('Commander action').t`Previous period`,
                    value: 'go-to-previous-view',
                    action: () => {
                        onClickPreviousView();
                    },
                    shortcuts: ['←'],
                },
                {
                    icon: 'magnifier',
                    label: c('Commander action').t`Search events`,
                    value: 'focus-search-bar',
                    action: () => {
                        onClickSearch();
                    },
                    shortcuts: ['/'],
                },
            ].filter(isTruthy) as CommanderItemInterface[],
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-169AAF
        [onClickNextView, onClickPreviousView, onClickToday, onChangeView]
    );

    return (
        <>
            {commanderRender && !isBookingActive ? <Commander list={commanderList} {...commanderModalProps} /> : null}
            {shortcutModalRender ? <CalendarShortcutsModal {...shortcutModalProps} /> : null}
        </>
    );
};

export default CalendarShortcutsAndCommander;
