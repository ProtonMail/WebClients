import { useCallback } from 'react';

import type { SOURCE_ACTION } from 'proton-mail/components/list/useListTelemetry';
import { usePermanentDeleteAll } from 'proton-mail/hooks/actions/delete/usePermanentDeleteAll';
import { usePermanentDeleteSelection } from 'proton-mail/hooks/actions/delete/usePermanentDeleteSelection';

export const usePermanentDelete = (labelID: string) => {
    const { handleDeleteSelection, deleteSelectionModal } = usePermanentDeleteSelection(labelID);
    const { handleDeleteAll, deleteAllModal } = usePermanentDeleteAll(labelID);

    const handleDelete = useCallback(
        async (selectedIDs: string[], sourceAction: SOURCE_ACTION, currentFolder: string, selectAll?: boolean) => {
            if (selectAll) {
                await handleDeleteAll(selectedIDs, sourceAction, currentFolder);
            } else {
                await handleDeleteSelection(selectedIDs, sourceAction, currentFolder);
            }
        },
        [handleDeleteAll, handleDeleteSelection]
    );

    return { handleDelete, deleteSelectionModal, deleteAllModal };
};
