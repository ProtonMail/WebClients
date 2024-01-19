import { useCallback } from 'react';

import { usePermanentDeleteAll } from 'proton-mail/hooks/actions/delete/usePermanentDeleteAll';
import { usePermanentDeleteSelection } from 'proton-mail/hooks/actions/delete/usePermanentDeleteSelection';

export const usePermanentDelete = (labelID: string) => {
    const { handleDeleteSelection, deleteSelectionModal } = usePermanentDeleteSelection(labelID);
    const { handleDeleteAll, deleteAllModal } = usePermanentDeleteAll(labelID);

    const handleDelete = useCallback(
        async (selectedIDs: string[], selectAll?: boolean) => {
            if (selectAll) {
                await handleDeleteAll(selectedIDs);
            } else {
                await handleDeleteSelection(selectedIDs);
            }
        },
        [handleDeleteAll, handleDeleteSelection]
    );

    return { handleDelete, deleteSelectionModal, deleteAllModal };
};
