import { useCallback } from 'react';

import type { SOURCE_ACTION } from '../../../components/list/list-telemetry/useListTelemetry';
import { usePermanentDeleteAll } from './usePermanentDeleteAll';
import { usePermanentDeleteSelection } from './usePermanentDeleteSelection';

export const usePermanentDelete = (labelID: string) => {
    const { handleDeleteSelection, deleteSelectionModal } = usePermanentDeleteSelection(labelID);
    const { handleDeleteAll, deleteAllModal } = usePermanentDeleteAll(labelID);

    const handleDelete = useCallback(
        async (selectedIDs: string[], sourceAction: SOURCE_ACTION, selectAll?: boolean) => {
            if (selectAll) {
                await handleDeleteAll(selectedIDs, sourceAction);
            } else {
                await handleDeleteSelection(selectedIDs, sourceAction);
            }
        },
        [handleDeleteAll, handleDeleteSelection]
    );

    return { handleDelete, deleteSelectionModal, deleteAllModal };
};
