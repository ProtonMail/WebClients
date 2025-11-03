import { type RefObject, useMemo } from 'react';

import { type HotkeyTuple, useHotkeys } from '@proton/components';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { isBusy } from '@proton/shared/lib/shortcuts/calendar';

interface Props {
    elementRef: RefObject<HTMLDivElement | Document>;
    onNext: () => void;
    onPrevious: () => void;
    onBackFromSearch: () => void;
}

const useCalendarSearchHotkeys = ({ elementRef, onNext, onPrevious, onBackFromSearch }: Props) => {
    const [mailSettings] = useMailSettings();
    const { Shortcuts } = mailSettings || {};

    const shortcutHandlers: HotkeyTuple[] = useMemo(
        () => [
            [
                [KeyboardKey.ArrowRight],
                (e) => {
                    if (Shortcuts && !isBusy(e)) {
                        e.preventDefault();
                        onNext();
                    }
                },
            ],
            [
                [KeyboardKey.ArrowLeft],
                (e) => {
                    if (Shortcuts && !isBusy(e)) {
                        e.preventDefault();
                        onPrevious();
                    }
                },
            ],
            [
                [KeyboardKey.Escape],
                (e) => {
                    if (!isBusy(e)) {
                        e.preventDefault();
                        onBackFromSearch();
                    }
                },
            ],
        ],
        [Shortcuts, onNext, onPrevious]
    );

    useHotkeys(elementRef, shortcutHandlers);
};

export default useCalendarSearchHotkeys;
