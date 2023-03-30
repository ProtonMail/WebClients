import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { FilePreview } from '@proton/components/containers';
import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { useFileView } from '../../store';

import './RevisionPreview.scss';

interface Props {
    shareId: string;
    linkId: string;
    revision: DriveFileRevision;
    onClose: () => void;
}

const RevisionPreview = ({ shareId, linkId, revision, onClose }: Props) => {
    const { contents, link, error, isLinkLoading, isContentLoading, downloadFile } = useFileView(
        shareId,
        linkId,
        false,
        revision.ID
    );

    return (
        <div className="revisions-preview">
            <FilePreview
                onDetail={() => {
                    // TODO: Add details trigger
                }}
                isMetaLoading={isLinkLoading}
                isLoading={isContentLoading}
                error={error ? error.message || error.toString?.() || c('Info').t`Unknown error` : undefined}
                fileName={link?.name}
                mimeType={link?.mimeType}
                fileSize={link?.size}
                contents={contents}
                onClose={onClose}
                onDownload={downloadFile}
                onRestore={() => {
                    // TODO: Add Restore trigger
                }}
                date={fromUnixTime(revision.CreateTime)}
            />
        </div>
    );
};

export default RevisionPreview;
