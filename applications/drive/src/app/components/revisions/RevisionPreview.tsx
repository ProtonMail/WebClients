import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { ModalStateProps, useModalTwo } from '@proton/components/components';
import { Portal } from '@proton/components/components/portal';
import { FilePreview } from '@proton/components/containers';
import type { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';
import { FileRevisionState } from '@proton/shared/lib/interfaces/drive/file';

import { useFileView } from '../../store';

import './RevisionPreview.scss';

interface Props {
    shareId: string;
    linkId: string;
    revision: DriveFileRevision;
}

const RevisionPreview = ({ shareId, linkId, revision, onClose, onExit, open }: Props & ModalStateProps) => {
    const { contents, link, error, isLinkLoading, isContentLoading, downloadFile } = useFileView(
        shareId,
        linkId,
        false,
        revision.ID
    );
    if (!open) {
        return null;
    }

    return (
        <Portal>
            <div className="revisions-preview">
                <FilePreview
                    isMetaLoading={isLinkLoading}
                    isLoading={isContentLoading}
                    error={error ? error.message || error.toString?.() || c('Info').t`Unknown error` : undefined}
                    fileName={link?.name}
                    mimeType={link?.mimeType}
                    fileSize={link?.size}
                    contents={contents}
                    onClose={() => {
                        onClose();
                        onExit();
                    }}
                    onDownload={downloadFile}
                    onRestore={
                        revision.State !== FileRevisionState.Active
                            ? () => {
                                  // TODO: Add revision restore logic
                              }
                            : undefined
                    }
                    date={fromUnixTime(revision.CreateTime)}
                />
            </div>
        </Portal>
    );
};

export default RevisionPreview;

export const useRevisionPreview = () => {
    return useModalTwo<Props, void>(RevisionPreview, false);
};
