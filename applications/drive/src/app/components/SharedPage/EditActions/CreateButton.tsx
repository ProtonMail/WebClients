import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms/index';
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components/index';
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
                disabled={isLoading}
                ref={anchorRef}
                onClick={toggle}
                className="flex gap-2 py-2 items-start justify-center text-left flex-column md:gap-4 md:py-3"
                size="medium"
            >
                <div className="w-full flex items-center gap-2">
                    <Icon name="plus" size={4} />
                    {isLoading && <CircleLoader />}
                </div>
                {c('Action').t`Create`}
            </Button>
            <Dropdown
                anchorRef={anchorRef}
                isOpen={isOpen}
                onClose={close}
                size={{
                    width: '15rem',
                }}
            >
                <DropdownMenu>
                    <DropdownMenuButton
                        className="text-left"
                        onClick={() =>
                            showCreateFolderModal({
                                folder: {
                                    shareId: token,
                                    linkId,
                                },
                                createFolder,
                            })
                        }
                        data-testid="download-button"
                    >
                        <Icon name="folder-plus" className="mr-2" />
                        {c('Action').t`New folder`}
                    </DropdownMenuButton>
                    {isDocsPublicSharingEnabled && (
                        <DropdownMenuButton
                            className="text-left"
                            onClick={() =>
                                withLoading(async () => {
                                    const documentLinkId = await createDocument(
                                        new AbortController().signal,
                                        token,
                                        linkId
                                    );
                                    openDocumentWindow({
                                        mode: 'open-url',
                                        token,
                                        urlPassword,
                                        linkId: documentLinkId,
                                        window: getNewWindow().handle,
                                    });
                                })
                            }
                            data-testid="download-button"
                        >
                            <Icon name="brand-proton-docs" className="mr-2" />
                            {c('Action').t`New document`}
                        </DropdownMenuButton>
                    )}
                </DropdownMenu>
            </Dropdown>
            {createFolderModal}
        </>
    );
};
