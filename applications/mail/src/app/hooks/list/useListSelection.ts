import { useMemo } from 'react';

import { c, msgid } from 'ttag';

import { useItemsDraggable } from '@proton/components';

import { getCanDisplaySelectAllBanner } from 'proton-mail/helpers/selectAll';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

import { isElementMessage } from '../../helpers/elements';
import type { Element } from '../../models/element';
import { pageSize as pageSizeSelector } from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';

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

    const { selectAll, locationCount, selectAllAvailable } = useSelectAll({ labelID: labelID || '' });

    const pageSize = useMailSelector(pageSizeSelector);

    const canShowSelectAllBanner = useMemo(() => {
        if (!labelID) {
            return false;
        }

        const labelIdString: string = labelID;

        return getCanDisplaySelectAllBanner({
            selectAllFeatureAvailable: selectAllAvailable,
            mailPageSize: pageSize,
            checkedIDs,
            labelID: labelIdString,
            isSearch,
            hasFilter,
        });
    }, [selectAllAvailable, pageSize, checkedIDs, labelID, isSearch, hasFilter]);

    const { draggedIDs, handleDragStart, handleDragEnd } = useItemsDraggable(
        elements,
        checkedIDs,
        onCheck,
        (draggedIDs: string[]) => {
            const isMessage = elements.length && isElementMessage(elements[0]);
            const selectionCount = selectAll ? locationCount : draggedIDs.length;
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
        locationCount,
        canShowSelectAllBanner,
    };
};
