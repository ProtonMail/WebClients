import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import {
    Dropdown,
    DropdownMenu,
    DropdownSizeUnit,
    Icon,
    SidebarPrimaryButton,
    usePopperAnchor,
} from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import { getCanWrite } from '@proton/shared/lib/drive/permissions';
import { getDevice } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { useActiveShare } from '../../../../hooks/drive/useActiveShare';
import { useCreateFolderModal } from '../../../../modals/CreateFolderModal';
import { useFileUploadInput, useFolderUploadInput, useFolderView } from '../../../../store';
import { useDocumentActions, useDriveDocsFeatureFlag, useIsSheetsEnabled } from '../../../../store/_documents';
import { CreateDocumentButton, CreateNewFolderButton, UploadFileButton, UploadFolderButton } from './ActionMenuButtons';
import CreateSheetButton from './ActionMenuButtons/CreateSheetButton';

interface ActionMenuButtonProps {
    disabled?: boolean;
    className?: string;
    collapsed: boolean;
}

// We put all input in the parent components because we need input to be present in the DOM
// even when the dropdown is closed
export const ActionMenuButton = ({ disabled, className, collapsed }: PropsWithChildren<ActionMenuButtonProps>) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const isDesktop = !getDevice()?.type;

    const { activeFolder } = useActiveShare();
    const folderView = useFolderView(activeFolder);
    const isEditor = useMemo(() => getCanWrite(folderView.permissions), [folderView.permissions]);
    const {
        inputRef: fileInput,
        handleClick: fileClick,
        handleChange: fileChange,
    } = useFileUploadInput(activeFolder.volumeId, activeFolder.shareId, activeFolder.linkId);
    const {
        inputRef: folderInput,
        handleClick: folderClick,
        handleChange: folderChange,
    } = useFolderUploadInput(activeFolder.volumeId, activeFolder.shareId, activeFolder.linkId);
    const { createFolderModal, showCreateFolderModal } = useCreateFolderModal();
    const { createDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const isSheetsEnabled = useIsSheetsEnabled();
    const activeFolderUid = generateNodeUid(activeFolder.volumeId, activeFolder.linkId);

    return (
        <>
            <SidebarPrimaryButton
                ref={anchorRef}
                disabled={disabled || !isEditor}
                className={clsx(
                    className,
                    !collapsed && 'flex justify-center items-center',
                    collapsed && 'px-0 md:flex'
                )}
                onClick={toggle}
            >
                <Icon className={clsx(!collapsed && 'mr-2', collapsed && 'flex mx-auto')} name="plus" />
                {!collapsed && (
                    <>
                        {
                            // translator: this string is used on Proton Drive to open a drop-down with 3 actions: Upload file, folder and new folder
                            c('Action').t`New`
                        }
                    </>
                )}
                {collapsed && (
                    <span className="sr-only">
                        {
                            // translator: this string is used on Proton Drive to open a drop-down with 3 actions: Upload file, folder and new folder
                            c('Action').t`New`
                        }
                    </span>
                )}
            </SidebarPrimaryButton>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={fileChange} />
            <input type="file" ref={folderInput} className="hidden" onChange={folderChange} />
            {createFolderModal}
            <Dropdown
                size={{ width: DropdownSizeUnit.Anchor, height: DropdownSizeUnit.Dynamic }}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                contentProps={{
                    className: 'w-full',
                }}
            >
                <DropdownMenu className="my-1">
                    <UploadFileButton onClick={fileClick} />
                    {isDesktop && <UploadFolderButton onClick={folderClick} />}
                    <hr className="my-2" />
                    <CreateNewFolderButton
                        onClick={() => showCreateFolderModal({ parentFolderUid: activeFolderUid })}
                    />
                    {isDocsEnabled && (
                        <CreateDocumentButton
                            onClick={() => {
                                void createDocument({
                                    type: 'doc',
                                    shareId: activeFolder.shareId,
                                    parentLinkId: activeFolder.linkId,
                                });
                            }}
                        />
                    )}
                    {isSheetsEnabled && (
                        <CreateSheetButton
                            onClick={() => {
                                void createDocument({
                                    type: 'sheet',
                                    shareId: activeFolder.shareId,
                                    parentLinkId: activeFolder.linkId,
                                });
                            }}
                        />
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
