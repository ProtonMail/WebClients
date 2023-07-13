import { useCallback, useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import {
    queryDeleteFileRevision,
    queryFileRevisions,
    queryRestoreFileRevision,
} from '@proton/shared/lib/api/drive/files';
import {
    DriveFileRestoreRevisionResult,
    DriveFileRevision,
    DriveFileRevisionsResult,
    FileRevisionState,
} from '@proton/shared/lib/interfaces/drive/file';

import useDebouncedRequest from '../_api/useDebouncedRequest';

const filterRevisions = (revisions: DriveFileRevision[]) => {
    // Draft state, we don't want to show it to the user
    return revisions.filter((revision) => revision.State !== FileRevisionState.Draft);
};

export default function useRevisionsView(shareId: string, linkId: string) {
    const debouncedRequest = useDebouncedRequest();
    const [isLoading, withLoading] = useLoading(true);
    const [revisions, setRevisions] = useState<DriveFileRevision[]>([]);

    const loadRevisions = useCallback(
        (abortSignal: AbortSignal) => {
            void withLoading(
                debouncedRequest<DriveFileRevisionsResult>(queryFileRevisions(shareId, linkId), abortSignal).then(
                    (result) => {
                        setRevisions(filterRevisions(result.Revisions));
                    }
                )
            );
        },
        [shareId, linkId]
    );

    useEffect(() => {
        const ac = new AbortController();
        loadRevisions(ac.signal);
        return () => {
            ac.abort();
        };
    }, [shareId, linkId]);
    const deleteRevision = async (abortSignal: AbortSignal, revisionId: string) => {
        await debouncedRequest(queryDeleteFileRevision(shareId, linkId, revisionId), abortSignal);
        setRevisions(revisions.filter((revision) => revision.ID !== revisionId));
    };

    const restoreRevision = async (abortSignal: AbortSignal, revisionId: string) => {
        const { Code } = await debouncedRequest<DriveFileRestoreRevisionResult>(
            queryRestoreFileRevision(shareId, linkId, revisionId),
            abortSignal
        );
        // If restore happened immediately fetch updated revision list
        if (Code === 1000) {
            loadRevisions(abortSignal);
        }
        return Code;
    };

    return {
        isLoading,
        revisions,
        deleteRevision,
        restoreRevision,
    };
}
