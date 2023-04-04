import { useEffect, useState } from 'react';

import { useLoading } from '@proton/components/hooks';
import { queryDeleteFileRevision, queryFileRevisions } from '@proton/shared/lib/api/drive/files';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import {
    DriveFileRevision,
    DriveFileRevisionsResult,
    FileRevisionState,
} from '@proton/shared/lib/interfaces/drive/file';

import useDebouncedRequest from '../_api/useDebouncedRequest';
import { DecryptedLink } from '../_links';
import { useDownload } from '../index';

const filterRevisions = (revisions: DriveFileRevision[]) => {
    // Draft state, we don't want to show it to the user
    return revisions.filter((revision) => revision.State !== FileRevisionState.Draft);
};

export default function useRevisionsView(link: DecryptedLink) {
    const debouncedRequest = useDebouncedRequest();
    const { download } = useDownload();
    const [isLoading, withLoading] = useLoading(true);
    const [revisions, setRevisions] = useState<DriveFileRevision[]>([]);
    const hasPreviewAvailable = !!link.mimeType && isPreviewAvailable(link.mimeType, link.size);

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(
            debouncedRequest<DriveFileRevisionsResult>(
                queryFileRevisions(link.rootShareId, link.linkId),
                ac.signal
            ).then((result) => {
                setRevisions(filterRevisions(result.Revisions));
            })
        );
        return () => {
            ac.abort();
        };
    }, [link.rootShareId, link.linkId]);

    const downloadRevision = (revision: DriveFileRevision) => {
        void download([{ ...link, shareId: link.rootShareId, revisionId: revision.ID }]);
    };

    const deleteRevision = async (abortSignal: AbortSignal, revisionId: string) => {
        await debouncedRequest(queryDeleteFileRevision(link.rootShareId, link.linkId, revisionId), abortSignal);
        setRevisions(revisions.filter((revision) => revision.ID !== revisionId));
    };

    return { isLoading, revisions, hasPreviewAvailable, downloadRevision, deleteRevision };
}
