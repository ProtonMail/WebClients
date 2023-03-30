import { ContextSeparator } from '@proton/components/components';
import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { useRevisions } from '../../store';
import { ContextMenuProps } from '../FileBrowser';
import { ItemContextMenu } from '../sections/ContextMenu/ItemContextMenu';
import {
    RevisionDeleteButton,
    RevisionDetailsButton,
    RevisionDownloadButton,
    RevisionPreviewButton,
    RevisionRestoreButton,
    RevisionSaveAsCopyButton,
} from './ContextMenuButtons';

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
    const { havePreviewAvailable, openRevisionPreview, downloadRevision } = useRevisions();
    if (isCurrent) {
        return (
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {havePreviewAvailable ? (
                    <RevisionPreviewButton
                        revision={revision}
                        openRevisionPreview={openRevisionPreview}
                        close={close}
                    />
                ) : null}
                <RevisionDownloadButton revision={revision} downloadRevision={downloadRevision} close={close} />
                <RevisionDetailsButton close={close} />
            </ItemContextMenu>
        );
    }
    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            {havePreviewAvailable && (
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
            <RevisionSaveAsCopyButton close={close} />
            <RevisionDownloadButton revision={revision} downloadRevision={downloadRevision} close={close} />
            <ContextSeparator />
            <RevisionDeleteButton deleteRevision={() => {}} revision={revision} close={close} />
        </ItemContextMenu>
    );
}
