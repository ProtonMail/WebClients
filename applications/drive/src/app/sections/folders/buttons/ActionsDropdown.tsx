import { useState } from 'react';

import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { ContextSeparator, Dropdown, DropdownMenu, ToolbarButton } from '@proton/components';
import { IcChevronDownFilled } from '@proton/icons/icons/IcChevronDownFilled';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { RenameActionButton } from '../../buttons/RenameActionButton';
import { ReportAbuseButton } from '../../commonButtons/ReportAbuseButton';
import type { FolderPermissions, FolderViewItem } from '../useFolder.store';
import type { FolderActions } from '../useFolderActions';
import { CopyButton } from './CopyButton';
import { CopyLinkContextButton } from './CopyLinkContextButton';
import { DetailsButton } from './DetailsButton';
import { MoveButton } from './MoveButton';
import { RevisionsContextButton } from './RevisionsContextButton';
import { ShareLinkButton } from './ShareLinkButton';
import { TrashButton } from './TrashButton';

interface Props {
    selectedItems: FolderViewItem[];
    permissions: FolderPermissions;
    canShareSelectedItem: boolean;
    actions: FolderActions;
}

export const ActionsDropdown = ({ selectedItems, permissions, canShareSelectedItem, actions }: Props) => {
    const [uid] = useState(generateUID('actions-dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const selectedItem = selectedItems[0];
    const isOnlyOneItem = selectedItems.length === 1 && !!selectedItem;
    const isOnlyOneFileItem = isOnlyOneItem && !!selectedItem?.isFile;
    const canCopyPublicLink = canShareSelectedItem && !!selectedItem?.isSharedPublicly;

    const {
        showSharingModal,
        showMoveModal,
        showCopyModal,
        showRenameModal,
        showDetailsModal,
        showRevisionsModal,
        showReportAbuseModal,
        getPublicLinkInfo,
    } = actions;

    return (
        <>
            <ToolbarButton
                disabled={!selectedItems.length}
                aria-describedby={uid}
                ref={anchorRef}
                aria-expanded={isOpen}
                onClick={toggle}
                icon={
                    <IcChevronDownFilled alt={c('Title').t`Show actions`} className={clsx(isOpen && 'rotateX-180')} />
                }
                data-testid="actions-dropdown"
                title={c('Title').t`Show actions`}
            />
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom">
                <DropdownMenu>
                    {canCopyPublicLink && <CopyLinkContextButton getPublicLinkInfo={getPublicLinkInfo} close={close} />}
                    {canShareSelectedItem && (
                        <ShareLinkButton type="context" onClick={showSharingModal} close={close} />
                    )}
                    <ContextSeparator />
                    {permissions.canMove && (
                        <MoveButton
                            type="context"
                            selectedItems={selectedItems}
                            onClick={showMoveModal}
                            close={close}
                        />
                    )}
                    {permissions.canCopy && <CopyButton type="context" onClick={showCopyModal} close={close} />}
                    {permissions.canRename && isOnlyOneItem && (
                        <RenameActionButton type="context" onClick={showRenameModal} close={close} />
                    )}
                    <DetailsButton
                        type="context"
                        selectedItems={selectedItems}
                        onClick={showDetailsModal}
                        close={close}
                    />
                    {(permissions.canEdit || permissions.canReportAbuse) && <ContextSeparator />}
                    {permissions.canEdit && isOnlyOneFileItem && selectedItem && (
                        <>
                            <RevisionsContextButton
                                nodeUid={selectedItem.uid}
                                rootShareId={selectedItem.rootShareId}
                                mediaType={selectedItem.mimeType}
                                showRevisionsModal={showRevisionsModal}
                                close={close}
                            />
                            <ContextSeparator />
                        </>
                    )}
                    {permissions.canTrash && <TrashButton type="context" selectedItems={selectedItems} close={close} />}
                    {permissions.canReportAbuse && isOnlyOneItem && (
                        <ReportAbuseButton buttonType="contextMenu" onClick={showReportAbuseModal} close={close} />
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
