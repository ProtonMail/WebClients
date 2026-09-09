import { useEffect, useMemo } from 'react';

import { c, msgid } from 'ttag';

import useItemsDraggable from '@proton/components/containers/items/useItemsDraggable';

import { getCanDisplaySelectAllBanner } from '../../helpers/selectAll';
import { useSelectAll } from '../useSelectAll';

import { isElementMessage } from '../../helpers/elements';
import type { Element } from '../../models/element';
import { selectPageSize } from '../../store/elements/elementsSelectors';
import { useMailDispatch, useMailSelector } from '../../store/hooks';
import { layoutActions } from '../../store/layout/layoutSlice';

/**
 * Hook to manage list selection, checked states, and drag-drop functionality
 */
export const useListSelection = ({
    elements = [],
    checkedIDs = [],
    labelID,
    onCheck,
    isSearch = false,
    hasFilter = false,
}: {
    elements: Element[];
    checkedIDs: string[];
    labelID?: string;
    onCheck: (IDs: string[], checked: boolean, replace: boolean) => void;
    isSearch?: boolean;
    hasFilter?: boolean;
}) => {
    const checkedIDsMap = useMemo<{ [ID: string]: boolean }>(() => {
        return checkedIDs.reduce(
            (acc: { [key: string]: boolean }, ID: string) => {
                acc[ID] = true;
                return acc;
            },
            {} as { [ID: string]: boolean }
        );
    }, [checkedIDs]);

    const { selectAll, locationCount } = useSelectAll({ labelID: labelID || '' });

    const pageSize = useMailSelector(selectPageSize);

    const canShowSelectAllBanner = useMemo(() => {
        if (!labelID) {
            return false;
        }

        const labelIdString: string = labelID;

        return getCanDisplaySelectAllBanner({
            mailPageSize: pageSize,
            checkedIDs,
            currentLabel: labelIdString,
            isSearch,
            hasFilter,
        });
    }, [pageSize, checkedIDs, labelID, isSearch, hasFilter]);

    const { draggedIDs, handleDragStart, handleDragEnd } = useItemsDraggable(
        elements,
        checkedIDs,
        onCheck,
        (draggedIDs: string[]) => {
            const isMessage = elements.length && isElementMessage(elements[0]);
            const selectionCount = selectAll ? locationCount.Total : draggedIDs.length;
            return isMessage
                ? c('Success').ngettext(
                      msgid`Move ${selectionCount} message`,
                      `Move ${selectionCount} messages`,
                      selectionCount
                  )
                : c('Success').ngettext(
                      msgid`Move ${selectionCount} conversation`,
                      `Move ${selectionCount} conversations`,
                      selectionCount
                  );
        },
        selectAll
    );

    const isDraggingElements = draggedIDs.length > 0;
    const dispatch = useMailDispatch();

    // Helps components outside the list to know when an element drag is in progress.
    useEffect(() => {
        dispatch(layoutActions.setDraggingElements(isDraggingElements));
        dispatch(layoutActions.setDraggingElementsCount(draggedIDs.length));
        // Only retain the dragged ID for single-message drags, which is what the
        // "create calendar event from mail" target supports. Multi-message drags
        // keep no IDs in global state.
        dispatch(layoutActions.setDraggedMessageID(draggedIDs.length === 1 ? draggedIDs[0] : null));

        return () => {
            dispatch(layoutActions.setDraggingElements(false));
            dispatch(layoutActions.setDraggingElementsCount(0));
            dispatch(layoutActions.setDraggedMessageID(null));
        };
    }, [isDraggingElements, draggedIDs.length, draggedIDs, dispatch]);

    const draggedIDsMap = useMemo<{ [ID: string]: boolean }>(() => {
        return draggedIDs.reduce(
            (acc: { [key: string]: boolean }, ID: string) => {
                acc[ID] = true;
                return acc;
            },
            {} as { [ID: string]: boolean }
        );
    }, [draggedIDs]);

    return {
        checkedIDsMap,
        draggedIDsMap,
        handleDragStart,
        handleDragEnd,
        selectAll,
        canShowSelectAllBanner,
    };
};
