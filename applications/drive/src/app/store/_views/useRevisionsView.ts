import { useEffect, useState } from 'react';

import { useLoading } from '@proton/components/hooks';
import { queryFileRevisions } from '@proton/shared/lib/api/drive/files';
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
    const debounceRequest = useDebouncedRequest();
    const { download } = useDownload();
    const [isLoading, withLoading] = useLoading(true);
    const [revisions, setRevisions] = useState<DriveFileRevision[]>([]);
    const hasPreviewAvailable = !!link.mimeType && isPreviewAvailable(link.mimeType, link.size);

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(
            debounceRequest<DriveFileRevisionsResult>(
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

    return { isLoading, revisions, hasPreviewAvailable, downloadRevision };
}
