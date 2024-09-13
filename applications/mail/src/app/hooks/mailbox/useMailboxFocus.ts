import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Filter, Sort } from 'proton-mail/models/tools';

export interface MailboxFocusProps {
    elementIDs: string[];
    page: number;
    filter: Filter;
    sort: Sort;
    showList: boolean; // Column is visible
    listRef: MutableRefObject<HTMLElement | null>;
    labelID: string;
    isComposerOpened: boolean;
    loading: boolean;
}

interface MailboxFocusContext {
    elementIDs: string[];
    page: number;
    filter: Filter;
    sort: Sort;
    labelID: string;
}

const areArraysEqual = (arr1: any[], arr2: any[]): boolean => {
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
};

export const useMailboxFocus = ({
    elementIDs,
    page,
    filter,
    sort,
    showList,
    listRef,
    labelID,
    isComposerOpened,
    loading,
}: MailboxFocusProps) => {
    const previousState = useRef<MailboxFocusContext>({ elementIDs, page, filter, sort, labelID });
    const [focusID, setFocusID] = useState<string | undefined>();

    const resetFocusID = () => setFocusID(undefined);

    const focusLastID = useCallback(() => {
        if (elementIDs.length === 0) {
            return;
        }
        setFocusID(elementIDs[elementIDs.length - 1]);
    }, [elementIDs]);

    const focusFirstID = useCallback(() => {
        if (elementIDs.length === 0) {
            return;
        }
        setFocusID(elementIDs[0]);
    }, [elementIDs]);

    const focusNextID = useCallback(() => {
        if (elementIDs.length === 0) {
            return;
        }
        if (!focusID) {
            setFocusID(elementIDs[0]);
            return;
        }
        const index = elementIDs.indexOf(focusID);
        if (index === -1) {
            setFocusID(elementIDs[0]);
        } else if (elementIDs[index + 1]) {
            setFocusID(elementIDs[index + 1]);
        }
    }, [elementIDs, focusID]);

    const focusPreviousID = useCallback(() => {
        if (elementIDs.length === 0) {
            return;
        }
        if (!focusID) {
            setFocusID(elementIDs[elementIDs.length - 1]);
            return;
        }
        const index = elementIDs.indexOf(focusID);
        if (index === -1) {
            setFocusID(elementIDs[0]);
        } else if (elementIDs[index - 1]) {
            setFocusID(elementIDs[index - 1]);
        }
    }, [elementIDs, focusID]);

    const focusElement = useCallback(() => {
        if (!focusID) {
            return;
        }

        const element = listRef.current?.querySelector(`[data-element-id="${focusID}"]`) as HTMLElement | null;

        if (element && document.activeElement !== element) {
            element.focus();
        }
    }, [focusID]);

    const saveNewState = useCallback(({ elementIDs, page, filter, sort, labelID }: MailboxFocusContext) => {
        previousState.current = { elementIDs, page, filter, sort, labelID };
    }, []);

    useEffect(() => {
        if (loading) {
            return;
        }

        // Reset focus when loading, not showing the list or composer is opened
        if (!showList || isComposerOpened) {
            resetFocusID();
            return;
        }

        // Reset focus when changing filter, sort, label or page
        if (
            previousState.current.filter !== filter ||
            previousState.current.sort !== sort ||
            previousState.current.labelID !== labelID ||
            previousState.current.page !== page
        ) {
            resetFocusID();
            saveNewState({ elementIDs, page, filter, sort, labelID });
            return;
        }

        // Reset focus when the list is empty
        if (elementIDs.length === 0) {
            resetFocusID();
            saveNewState({ elementIDs, page, filter, sort, labelID });
            return;
        }

        // If the list has changed
        if (!areArraysEqual(previousState.current.elementIDs, elementIDs)) {
            if (focusID && !elementIDs.includes(focusID)) {
                // Focus the next element if the focusID is not in the list
                const index = previousState.current.elementIDs.indexOf(focusID);
                if (index === -1) {
                    // If the focusID is not in the list, reset focus
                    resetFocusID();
                } else if (elementIDs[index]) {
                    // Focus the next element if it exists
                    setFocusID(elementIDs[index]);
                } else {
                    // Or reset focus
                    resetFocusID();
                }
            }
            saveNewState({ elementIDs, page, filter, sort, labelID });
        }
    }, [elementIDs, page, filter, sort, showList, labelID, isComposerOpened, loading, focusID]);

    useEffect(() => {
        if (typeof focusID === 'undefined') {
            return;
        }
        focusElement();
    }, [focusID]);

    return {
        focusID,
        setFocusID,
        focusLastID,
        focusFirstID,
        focusNextID,
        focusPreviousID,
    };
};
