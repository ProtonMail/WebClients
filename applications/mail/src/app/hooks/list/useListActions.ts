import type { RefObject } from 'react';

import noop from '@proton/utils/noop';

import type { SOURCE_ACTION } from '../../components/list/list-telemetry/useListTelemetry';
import { useItemContextMenu } from '../../components/list/useItemContextMenu';

/**
 * Hook to manage list actions like mark as, delete, move, etc.
 */
export const useListActions = ({
    elementID,
    labelID,
    checkedIDs = [],
    onCheck,
    conversationMode = false,
    anchorRef,
    customActions = {},
}: {
    elementID?: string;
    labelID?: string;
    checkedIDs?: string[];
    onCheck: (IDs: string[], checked: boolean, replace: boolean) => void;
    conversationMode?: boolean;
    anchorRef: RefObject<HTMLElement>;
    customActions?: {
        onMarkAs?: (status: any, sourceAction: SOURCE_ACTION) => void;
        onDelete?: (sourceAction: SOURCE_ACTION) => void;
        onMove?: (destinationLabelID: string, sourceAction: SOURCE_ACTION) => void;
    };
}) => {
    const { onMarkAs = noop, onDelete = noop, onMove = noop } = customActions;
    const { contextMenu, onContextMenu, blockSenderModal } = useItemContextMenu({
        elementID,
        labelID: labelID || '',
        anchorRef,
        checkedIDs,
        onCheck,
        onMarkAs,
        onMove,
        onDelete,
        conversationMode,
    });

    return {
        onMarkAs,
        onDelete,
        onMove,
        contextMenu,
        onContextMenu,
        blockSenderModal,
    };
};
