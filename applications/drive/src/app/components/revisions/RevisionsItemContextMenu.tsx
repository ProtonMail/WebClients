import { useMemo } from 'react';

import { ContextSeparator } from '@proton/components/components';
import { getCanAdmin } from '@proton/shared/lib/drive/permissions';

import type { DriveFileRevision } from '../../store';
import type { ContextMenuProps } from '../FileBrowser';
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
    const {
        permissions,
        hasPreviewAvailable,
        openRevisionPreview,
        downloadRevision,
        openRevisionDetails,
        deleteRevision,
        restoreRevision,
    } = useRevisionsProvider();
    const isAdmin = useMemo(() => getCanAdmin(permissions), [permissions]);
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
            <RevisionRestoreButton restoreRevision={restoreRevision} revision={revision} close={close} />
            <RevisionDownloadButton revision={revision} downloadRevision={downloadRevision} close={close} />
            <ContextSeparator />
            <RevisionDetailsButton revision={revision} openRevisionDetails={openRevisionDetails} close={close} />

            {isAdmin && (
                <>
                    <ContextSeparator />
                    <RevisionDeleteButton deleteRevision={deleteRevision} revision={revision} close={close} />
                </>
            )}
        </ItemContextMenu>
    );
}
