import { useEffect, useState } from 'react';

import { useLoading } from '@proton/components/hooks';
import { queryDeleteFileRevision, queryFileRevisions } from '@proton/shared/lib/api/drive/files';
import {
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

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(
            debouncedRequest<DriveFileRevisionsResult>(queryFileRevisions(shareId, linkId), ac.signal).then(
                (result) => {
                    setRevisions(filterRevisions(result.Revisions));
                }
            )
        );
        return () => {
            ac.abort();
        };
    }, [shareId, linkId]);
    const deleteRevision = async (abortSignal: AbortSignal, revisionId: string) => {
        await debouncedRequest(queryDeleteFileRevision(shareId, linkId, revisionId), abortSignal);
        setRevisions(revisions.filter((revision) => revision.ID !== revisionId));
    };

    return {
        isLoading,
        revisions,
        deleteRevision,
    };
}
