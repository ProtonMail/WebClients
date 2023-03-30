import { useState } from 'react';

import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { DecryptedLink, useDownload } from '../index';

export default function useRevisions(link: DecryptedLink) {
    const [selectedRevision, setSelectedRevision] = useState<DriveFileRevision>();
    const [previewOpen, setPreviewOpen] = useState(false);
    const { download } = useDownload();

    const openRevisionPreview = (revision: DriveFileRevision) => {
        setPreviewOpen(true);
        setSelectedRevision(revision);
    };

    const downloadRevision = (revision: DriveFileRevision) => {
        void download([{ ...link, shareId: link.rootShareId, revisionId: revision.ID }]);
    };

    const closeRevisionPreview = () => {
        setPreviewOpen(false);
    };

    return {
        selectedRevision,
        previewOpen,
        openRevisionPreview,
        downloadRevision,
        closeRevisionPreview,
    };
}
