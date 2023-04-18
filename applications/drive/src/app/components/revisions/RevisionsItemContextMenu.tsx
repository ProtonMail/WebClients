import { ContextSeparator } from '@proton/components/components';
import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { ContextMenuProps } from '../FileBrowser';
import { ItemContextMenu } from '../sections/ContextMenu/ItemContextMenu';
import {
    RevisionDeleteButton,
    RevisionDetailsButton,
    RevisionDownloadButton,
    RevisionPreviewButton,
    RevisionRestoreButton,
} from './ContextMenuButtons';
import { useRevisionsProvider } from './RevisionsProvider';

export function RevisionsItemContextMenu({
    anchorRef,
    isOpen,
    position,
    open,
    close,
    revision,
    isCurrent,
}: ContextMenuProps & {
    revision: DriveFileRevision;
    isCurrent: boolean;
}) {
    const { hasPreviewAvailable, openRevisionPreview, downloadRevision, openRevisionDetails, deleteRevision } =
        useRevisionsProvider();
    if (isCurrent) {
        return (
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {hasPreviewAvailable ? (
                    <RevisionPreviewButton
                        revision={revision}
                        openRevisionPreview={openRevisionPreview}
                        close={close}
                    />
                ) : null}
                <RevisionDownloadButton revision={revision} downloadRevision={downloadRevision} close={close} />
                <RevisionDetailsButton revision={revision} openRevisionDetails={openRevisionDetails} close={close} />
            </ItemContextMenu>
        );
    }
    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            {hasPreviewAvailable && (
                <>
                    <RevisionPreviewButton
                        revision={revision}
                        openRevisionPreview={openRevisionPreview}
                        close={close}
                    />
                    <ContextSeparator />
                </>
            )}
            <RevisionRestoreButton close={close} />
            <RevisionDownloadButton revision={revision} downloadRevision={downloadRevision} close={close} />
            <ContextSeparator />
            <RevisionDetailsButton revision={revision} openRevisionDetails={openRevisionDetails} close={close} />
            <ContextSeparator />
            <RevisionDeleteButton deleteRevision={deleteRevision} revision={revision} close={close} />
        </ItemContextMenu>
    );
}
