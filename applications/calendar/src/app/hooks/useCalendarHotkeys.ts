import { type RefObject, useMemo } from 'react';

import { type HotkeyTuple, useHotkeys } from '@proton/components';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { isBusy } from '@proton/shared/lib/shortcuts/calendar';
import useFlag from '@proton/unleash/useFlag';

interface Props {
    showCommander: (state: boolean) => void;
    createEvent: () => void;
    goToToday: () => void;
    elementRef: RefObject<HTMLDivElement | Document>;
    goToNextView: () => void;
    goToPreviousView: () => void;
    showDayView: () => void;
    showWeekView: () => void;
    showMonthView: () => void;
    focusSearchBar: () => void;
    openShortcutModal: () => void;
    isDrawerApp: boolean;
}

const useCalendarHotkeys = ({
    showCommander,
    createEvent,
    goToToday,
    goToNextView,
    goToPreviousView,
    showDayView,
    showWeekView,
    showMonthView,
    focusSearchBar,
    openShortcutModal,
    elementRef,
    isDrawerApp,
}: Props) => {
    const isCalendarHotkeysEnabled = useFlag('CalendarHotkeys');
    const [mailSettings] = useMailSettings();
    const shortcutHandlers: HotkeyTuple[] = useMemo(
        () => [
            [
                [KeyboardKey.N],
                (e) => {
                    if (isCalendarHotkeysEnabled && mailSettings.Shortcuts && !isBusy(e) && !isDrawerApp) {
                        e.preventDefault();
                        createEvent();
                    }
                },
            ],
            [
                [KeyboardKey.T],
                (e) => {
                    if (isCalendarHotkeysEnabled && mailSettings.Shortcuts && !isBusy(e) && !isDrawerApp) {
                        e.preventDefault();
                        goToToday();
                    }
                },
            ],
            [
                [KeyboardKey.One],
                (e) => {
                    if (isCalendarHotkeysEnabled && mailSettings.Shortcuts && !isBusy(e) && !isDrawerApp) {
                        e.preventDefault();
                        showDayView();
                    }
                },
            ],
            [
                [KeyboardKey.Two],
                (e) => {
                    if (isCalendarHotkeysEnabled && mailSettings.Shortcuts && !isBusy(e) && !isDrawerApp) {
                        e.preventDefault();
                        showWeekView();
                    }
                },
            ],
            [
                [KeyboardKey.Three],
                (e) => {
                    if (isCalendarHotkeysEnabled && mailSettings.Shortcuts && !isBusy(e) && !isDrawerApp) {
                        e.preventDefault();
                        showMonthView();
                    }
                },
            ],
            [
                [KeyboardKey.ArrowRight],
                (e) => {
                    if (isCalendarHotkeysEnabled && mailSettings.Shortcuts && !isBusy(e) && !isDrawerApp) {
                        e.preventDefault();
                        goToNextView();
                    }
                },
            ],
            [
                [KeyboardKey.ArrowLeft],
                (e) => {
                    if (isCalendarHotkeysEnabled && mailSettings.Shortcuts && !isBusy(e) && !isDrawerApp) {
                        e.preventDefault();
                        goToPreviousView();
                    }
                },
            ],
            [
                [KeyboardKey.Meta, KeyboardKey.K],
                (e) => {
                    if (!isBusy(e) && !isDrawerApp) {
                        e.preventDefault();
                        showCommander(true);
                    }
                },
            ],
            [
                [KeyboardKey.Slash],
                (e) => {
                    if (isCalendarHotkeysEnabled && mailSettings.Shortcuts && !isBusy(e) && !isDrawerApp) {
                        e.preventDefault();
                        focusSearchBar();
                    }
                },
            ],
            [
                [KeyboardKey.QuestionMark],
                (e) => {
                    if (isCalendarHotkeysEnabled && !isBusy(e) && !isDrawerApp) {
                        e.preventDefault();
                        openShortcutModal();
                    }
                },
            ],
        ],
        [
            goToToday,
            goToNextView,
            goToPreviousView,
            showCommander,
            createEvent,
            showDayView,
            showWeekView,
            showMonthView,
            mailSettings.Shortcuts,
        ]
    );

    useHotkeys(elementRef, shortcutHandlers);
};

export default useCalendarHotkeys;
