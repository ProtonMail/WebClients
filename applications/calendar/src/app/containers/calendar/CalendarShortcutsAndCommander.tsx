import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { CalendarShortcutsModal, Commander, type CommanderItemInterface, useModalState } from '@proton/components';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import type { AttendeeModel } from '@proton/shared/lib/interfaces/calendar';
import useFlag from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import useCalendarHotkeys from '../../hooks/useCalendarHotkeys';

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
    const isCommanderAvailable = useFlag('CalendarCommander');
    const isCalendarHotkeysEnabled = useFlag('CalendarHotkeys');
    const [commanderModalProps, showCommander, commanderRender] = useModalState();
    const [shortcutModalProps, showShortcutModal, shortcutModalRender] = useModalState();

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
                    shortcuts: isCalendarHotkeysEnabled ? ['N'] : undefined,
                },
                {
                    icon: 'calendar-today',
                    label: c('Commander action').t`Today`,
                    value: 'move-to-today',
                    action: () => {
                        onClickToday();
                    },
                    shortcuts: isCalendarHotkeysEnabled ? ['T'] : undefined,
                },
                {
                    icon: 'calendar-day',
                    label: c('Commander action').t`Day view`,
                    value: 'show-day-view',
                    action: () => {
                        onChangeView(VIEWS.DAY);
                    },
                    shortcuts: isCalendarHotkeysEnabled ? ['1'] : undefined,
                },
                {
                    icon: 'calendar-week',
                    label: c('Commander action').t`Week view`,
                    value: 'show-week-view',
                    action: () => {
                        onChangeView(VIEWS.WEEK);
                    },
                    shortcuts: isCalendarHotkeysEnabled ? ['2'] : undefined,
                },
                {
                    icon: 'calendar-month',
                    label: c('Commander action').t`Month view`,
                    value: 'show-month-view',
                    action: () => {
                        onChangeView(VIEWS.MONTH);
                    },
                    shortcuts: isCalendarHotkeysEnabled ? ['3'] : undefined,
                },
                {
                    icon: 'arrow-right',
                    label: c('Commander action').t`Next period`,
                    value: 'go-to-next-view',
                    action: () => {
                        onClickNextView();
                    },
                    shortcuts: isCalendarHotkeysEnabled ? ['→'] : undefined,
                },
                {
                    icon: 'arrow-left',
                    label: c('Commander action').t`Previous period`,
                    value: 'go-to-previous-view',
                    action: () => {
                        onClickPreviousView();
                    },
                    shortcuts: isCalendarHotkeysEnabled ? ['←'] : undefined,
                },
                {
                    icon: 'magnifier',
                    label: c('Commander action').t`Search events`,
                    value: 'focus-search-bar',
                    action: () => {
                        onClickSearch();
                    },
                    shortcuts: isCalendarHotkeysEnabled ? ['/'] : undefined,
                },
            ].filter(isTruthy) as CommanderItemInterface[],
        [onClickNextView, onClickPreviousView, onClickToday, onChangeView]
    );

    return (
        <>
            {isCommanderAvailable && commanderRender ? (
                <Commander list={commanderList} {...commanderModalProps} />
            ) : null}
            {shortcutModalRender ? <CalendarShortcutsModal {...shortcutModalProps} /> : null}
        </>
    );
};

export default CalendarShortcutsAndCommander;
