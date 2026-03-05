import { ContextSeparator } from '@proton/components';
import type { Revision } from '@proton/drive';

import type { ContextMenuProps } from '../../../components/FileBrowser';
import { ItemContextMenu } from '../../../components/sections/ContextMenu/ItemContextMenu';
import type { RevisionsProviderState } from '../useRevisionsModalState';
import { RevisionDeleteButton } from './ContextMenuButtons/RevisionDeleteButton';
import { RevisionDetailsButton } from './ContextMenuButtons/RevisionDetailsButton';
import { RevisionDownloadButton } from './ContextMenuButtons/RevisionDownloadButton';
import { RevisionPreviewButton } from './ContextMenuButtons/RevisionPreviewButton';
import { RevisionRestoreButton } from './ContextMenuButtons/RevisionRestoreButton';

type RevisionActionProps = Pick<
    RevisionsProviderState,
    | 'hasPreviewAvailable'
    | 'isOwner'
    | 'openRevisionPreview'
    | 'openRevisionDetails'
    | 'deleteRevision'
    | 'restoreRevision'
    | 'downloadRevision'
>;

export function RevisionsItemContextMenu({
    anchorRef,
    isOpen,
    position,
    open,
    close,
    revision,
    isCurrent,
    hasPreviewAvailable,
    isOwner,
    openRevisionPreview,
    downloadRevision,
    openRevisionDetails,
    deleteRevision,
    restoreRevision,
}: ContextMenuProps & {
    revision: Revision;
    isCurrent: boolean;
} & RevisionActionProps) {
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

            {isOwner && (
                <>
                    <ContextSeparator />
                    <RevisionDeleteButton deleteRevision={deleteRevision} revision={revision} close={close} />
                </>
            )}
        </ItemContextMenu>
    );
}
