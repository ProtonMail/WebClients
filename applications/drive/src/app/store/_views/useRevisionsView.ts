import { useEffect, useState } from 'react';

import { useLoading } from '@proton/components/hooks';
import { queryFileRevisions } from '@proton/shared/lib/api/drive/files';
import { DriveFileRevision, DriveFileRevisionsResult } from '@proton/shared/lib/interfaces/drive/file';

import useDebouncedRequest from '../_api/useDebouncedRequest';

export default function useRevisionsView(shareId: string, linkId: string) {
    const debounceRequest = useDebouncedRequest();
    const [isLoading, withLoading] = useLoading(true);
    const [revisions, setRevisions] = useState<DriveFileRevision[]>([]);
    useEffect(() => {
        const ac = new AbortController();
        void withLoading(
            debounceRequest<DriveFileRevisionsResult>(queryFileRevisions(shareId, linkId), ac.signal).then((result) => {
                setRevisions(result.Revisions);
            })
        );
        return () => {
            ac.abort();
        };
    }, [shareId, linkId]);

    return { isLoading, revisions };
}
