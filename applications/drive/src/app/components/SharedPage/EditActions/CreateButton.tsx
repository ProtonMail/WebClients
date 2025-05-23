import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { getNewWindow } from '@proton/shared/lib/helpers/window';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import { usePublicActions } from '../../../store';
import { useDriveDocsPublicSharingFF, useOpenDocument } from '../../../store/_documents';
import { useCreateFolderModal } from '../../modals/CreateFolderModal';

interface Props {
    token: string;
    linkId: string;
}

export const CreateButton = ({ token, linkId }: Props) => {
    const { createFolder, createDocument } = usePublicActions();
    const { urlPassword } = usePublicToken();
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModal();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { openDocumentWindow } = useOpenDocument();
    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();

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
                <Icon name="plus" size={4} />
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
                        <Icon name="folder-plus" />
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
                                        linkId
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
                            <Icon name="brand-proton-docs" />
                            {c('Action').t`New document`}
                        </DropdownMenuButton>
                    )}
                </DropdownMenu>
            </Dropdown>
            {createFolderModal}
        </>
    );
};
