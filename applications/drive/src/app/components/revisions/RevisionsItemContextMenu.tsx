import { ContextSeparator } from '@proton/components/components';
import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { ContextMenuProps } from '../FileBrowser';
import { PreviewButton } from '../sections/ContextMenu';
import { ItemContextMenu } from '../sections/ContextMenu/ItemContextMenu';
import {
    RevisionDeleteButton,
    RevisionDetailsButton, // TODO: Replace with DetailsButton when modal refactor will be merged
    RevisionRestoreButton,
    RevisionSaveAsCopyButton,
} from './ContextMenuButtons';

export function RevisionsItemContextMenu({
    anchorRef,
    isOpen,
    position,
    open,
    close,
    havePreviewAvailable,
    // revisionId,
    isCurrent,
}: ContextMenuProps & {
    revisionId: DriveFileRevision['ID'];
    havePreviewAvailable: boolean;
    isCurrent: boolean;
}) {
    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            {havePreviewAvailable && (
                <>
                    {/* TODO: Change it when implementing preview feature */}
                    <PreviewButton shareId="dsdaa" linkId="dsdsa" close={close} />
                    {!isCurrent ? <ContextSeparator /> : null}
                </>
            )}
            {!isCurrent ? (
                <>
                    <RevisionRestoreButton close={() => {}} />
                    <RevisionSaveAsCopyButton close={() => {}} />
                    <ContextSeparator />
                </>
            ) : null}

            <RevisionDetailsButton close={() => {}} />
            {!isCurrent ? (
                <>
                    <ContextSeparator />
                    <RevisionDeleteButton close={() => {}} />
                </>
            ) : null}
        </ItemContextMenu>
    );
}
