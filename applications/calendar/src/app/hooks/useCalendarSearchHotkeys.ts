import { type RefObject, useMemo } from 'react';

import { type HotkeyTuple, useHotkeys } from '@proton/components';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { isBusy } from '@proton/shared/lib/shortcuts/calendar';
import useFlag from '@proton/unleash/useFlag';

interface Props {
    elementRef: RefObject<HTMLDivElement | Document>;
    onNext: () => void;
    onPrevious: () => void;
}

const useCalendarSearchHotkeys = ({ elementRef, onNext, onPrevious }: Props) => {
    const isCalendarHotkeysEnabled = useFlag('CalendarHotkeys');
    const [mailSettings] = useMailSettings();
    const { Shortcuts } = mailSettings || {};

    const shortcutHandlers: HotkeyTuple[] = useMemo(
        () => [
            [
                [KeyboardKey.ArrowRight],
                (e) => {
                    if (isCalendarHotkeysEnabled && Shortcuts && !isBusy(e)) {
                        e.preventDefault();
                        onNext();
                    }
                },
            ],
            [
                [KeyboardKey.ArrowLeft],
                (e) => {
                    if (isCalendarHotkeysEnabled && Shortcuts && !isBusy(e)) {
                        e.preventDefault();
                        onPrevious();
                    }
                },
            ],
        ],
        [Shortcuts, onNext, onPrevious]
    );

    useHotkeys(elementRef, shortcutHandlers);
};

export default useCalendarSearchHotkeys;
