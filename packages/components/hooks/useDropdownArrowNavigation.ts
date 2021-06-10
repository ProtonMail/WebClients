import { useEffect, MutableRefObject } from 'react';
import { FocusableElement, tabbable } from 'tabbable';
import { HotkeyTuple } from './useHotkeys';

interface Context {
    isOpen: boolean;
    rootRef: MutableRefObject<HTMLDivElement | null>;
    disabled?: boolean;
    preventArrowKeyNavigationAutofocus?: boolean;
}

const useDropdownArrowNavigation = ({
    isOpen,
    rootRef,
    disabled = false,
    preventArrowKeyNavigationAutofocus = false,
}: Context) => {
    const getDropdownMenuItems = () => {
        if (!rootRef.current) {
            return [];
        }

        return tabbable(rootRef.current, { includeContainer: false }).filter(
            (elm) => !elm.dataset.preventArrowNavigation
        );
    };

    const getFocusIndex = () => getDropdownMenuItems().findIndex((elm) => elm === document.activeElement);

    const findElementAndFocus = (startingIndex: number) => {
        const dropdownMenuItems = getDropdownMenuItems();

        if (
            !dropdownMenuItems.length ||
            !document.activeElement ||
            !dropdownMenuItems.includes(document.activeElement as FocusableElement)
        ) {
            return;
        }

        const lastIndex = dropdownMenuItems.length - 1;
        let index = startingIndex;

        /* loop from last to first item */
        if (index > lastIndex) {
            index = 0;
        }
        /* reverse loop from first to last item */
        if (index < 0) {
            index = lastIndex;
        }

        const elem = dropdownMenuItems[index] as any;

        elem.focus();
    };

    const focusOnFirst = () => {
        const index = 0;
        findElementAndFocus(index);
    };

    const focusOnLast = () => {
        const dropdownMenuItems = getDropdownMenuItems();
        const index = dropdownMenuItems.length - 1;
        findElementAndFocus(index);
    };

    const focusOnPrevious = () => {
        const focusIndex = getFocusIndex();
        findElementAndFocus(focusIndex - 1);
    };

    const focusOnNext = () => {
        const focusIndex = getFocusIndex();
        findElementAndFocus(focusIndex + 1);
    };

    const shortcutHandlers: HotkeyTuple[] = [
        [
            'ArrowUp',
            (e) => {
                e.preventDefault();
                focusOnPrevious();
            },
        ],
        [
            ['Meta', 'ArrowUp'],
            (e) => {
                e.preventDefault();
                focusOnFirst();
            },
        ],
        [
            'ArrowDown',
            (e) => {
                e.preventDefault();
                focusOnNext();
            },
        ],
        [
            ['Meta', 'ArrowDown'],
            (e) => {
                e.preventDefault();
                focusOnLast();
            },
        ],
    ];

    useEffect(() => {
        if (isOpen && !disabled && !preventArrowKeyNavigationAutofocus) {
            const dropdownMenuItems = getDropdownMenuItems();
            dropdownMenuItems[0]?.focus();
        }
    }, [isOpen, disabled, preventArrowKeyNavigationAutofocus]);

    return {
        shortcutHandlers,
    };
};

export default useDropdownArrowNavigation;
