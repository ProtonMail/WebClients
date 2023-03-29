import { useEffect, useState } from 'react';

import { useLoading } from '@proton/components/hooks';
import { queryFileRevisions } from '@proton/shared/lib/api/drive/files';
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
    const debounceRequest = useDebouncedRequest();
    const [isLoading, withLoading] = useLoading(true);
    const [revisions, setRevisions] = useState<DriveFileRevision[]>([]);
    useEffect(() => {
        const ac = new AbortController();
        void withLoading(
            debounceRequest<DriveFileRevisionsResult>(queryFileRevisions(shareId, linkId), ac.signal).then((result) => {
                setRevisions(filterRevisions(result.Revisions));
            })
        );
        return () => {
            ac.abort();
        };
    }, [shareId, linkId]);

    return { isLoading, revisions };
}
