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
import { getCanWrite } from '@proton/shared/lib/drive/permissions';
import { getDevice } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { useActiveShare } from '../../../../hooks/drive/useActiveShare';
import { useActions, useFileUploadInput, useFolderUploadInput, useFolderView } from '../../../../store';
import { useDocumentActions, useDriveDocsFeatureFlag } from '../../../../store/_documents';
import { useCreateFolderModal } from '../../../modals/CreateFolderModal';
import { CreateDocumentButton, CreateNewFolderButton, UploadFileButton, UploadFolderButton } from './ActionMenuButtons';

interface Props {
    disabled?: boolean;
    className?: string;
}

// We put all input in the parent components because we need input to be present in the DOM
// even when the dropdown is closed
export const ActionMenuButton = ({ disabled, className }: PropsWithChildren<Props>) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const isDesktop = !getDevice()?.type;

    const { activeFolder } = useActiveShare();
    const { createFolder } = useActions();
    const folderView = useFolderView(activeFolder);
    const isEditor = useMemo(() => getCanWrite(folderView.permissions), [folderView.permissions]);
    const {
        inputRef: fileInput,
        handleClick: fileClick,
        handleChange: fileChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);
    const {
        inputRef: folderInput,
        handleClick: folderClick,
        handleChange: folderChange,
    } = useFolderUploadInput(activeFolder.shareId, activeFolder.linkId);
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModal();
    const { createDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();

    return (
        <>
            <SidebarPrimaryButton
                ref={anchorRef}
                disabled={disabled || !isEditor}
                className={clsx(className, 'flex justify-center items-center')}
                onClick={toggle}
            >
                <Icon className="mr-2" name="plus" />
                {
                    // translator: this string is used on Proton Drive to open a drop-down with 3 actions: Upload file, folder and new folder
                    c('Action').t`New`
                }
            </SidebarPrimaryButton>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={fileChange} />
            <input type="file" ref={folderInput} className="hidden" onChange={folderChange} />
            {createFolderModal}
            <Dropdown
                size={{ width: DropdownSizeUnit.Anchor, height: DropdownSizeUnit.Dynamic }}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
            >
                <DropdownMenu className="my-1">
                    <UploadFileButton onClick={fileClick} />
                    {isDesktop && <UploadFolderButton onClick={folderClick} />}
                    <hr className="my-2" />
                    <CreateNewFolderButton
                        onClick={() => showCreateFolderModal({ folder: activeFolder, createFolder })}
                    />
                    {isDocsEnabled && (
                        <CreateDocumentButton
                            onClick={() => {
                                void createDocument({
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
