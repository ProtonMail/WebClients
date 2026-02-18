import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Dropdown, DropdownMenu, DropdownMenuButton, MimeIcon, usePopperAnchor } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { IcFolderPlus } from '@proton/icons/icons/IcFolderPlus';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { getNewWindow } from '@proton/shared/lib/helpers/window';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import { usePublicActions } from '../../../store';
import { useDriveDocsPublicSharingFF, useIsSheetsEnabled, useOpenDocument } from '../../../store/_documents';
import { useCreateFolderModalDeprecated } from '../../modals/CreateFolderModal';

interface Props {
    token: string;
    linkId: string;
}

export const CreateButton = ({ token, linkId }: Props) => {
    const { createDocument, createFolder } = usePublicActions();
    const { urlPassword } = usePublicToken();
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModalDeprecated();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { openDocumentWindow } = useOpenDocument();
    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();
    const isSheetsEnabled = useIsSheetsEnabled();

    const [isLoading, withLoading] = useLoading();

    return (
        <>
            <Button
                loading={isLoading}
                ref={anchorRef}
                onClick={toggle}
                className="flex gap-2 items-center"
                size="medium"
            >
                <IcPlus size={4} />
                {c('Action').t`Create`}
            </Button>
            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuButton
                        className="flex items-center gap-2"
                        onClick={() =>
                            showCreateFolderModal({
                                folder: {
                                    shareId: token,
                                    linkId,
                                },
                                createFolder,
                            })
                        }
                    >
                        <IcFolderPlus />
                        {c('Action').t`New folder`}
                    </DropdownMenuButton>
                    {isDocsPublicSharingEnabled && (
                        <DropdownMenuButton
                            className="flex items-center gap-2"
                            onClick={() =>
                                withLoading(async () => {
                                    const documentLinkId = await createDocument(
                                        new AbortController().signal,
                                        token,
                                        linkId,
                                        'doc'
                                    );
                                    openDocumentWindow({
                                        type: 'doc',
                                        mode: 'open-url',
                                        token,
                                        urlPassword,
                                        linkId: documentLinkId,
                                        window: getNewWindow().handle,
                                    });
                                })
                            }
                        >
                            <MimeIcon name="proton-doc" />
                            {c('Action').t`New document`}
                        </DropdownMenuButton>
                    )}
                    {isDocsPublicSharingEnabled && isSheetsEnabled && (
                        <DropdownMenuButton
                            className="flex items-center gap-2"
                            onClick={() =>
                                withLoading(async () => {
                                    const sheetLinkId = await createDocument(
                                        new AbortController().signal,
                                        token,
                                        linkId,
                                        'sheet'
                                    );
                                    openDocumentWindow({
                                        type: 'sheet',
                                        mode: 'open-url',
                                        token,
                                        urlPassword,
                                        linkId: sheetLinkId,
                                        window: getNewWindow().handle,
                                    });
                                })
                            }
                        >
                            <MimeIcon name="proton-sheet" />
                            {c('Action').t`New spreadsheet`}
                        </DropdownMenuButton>
                    )}
                </DropdownMenu>
            </Dropdown>
            {createFolderModal}
        </>
    );
};
