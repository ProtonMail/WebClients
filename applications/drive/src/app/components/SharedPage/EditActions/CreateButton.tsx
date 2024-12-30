import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components/index';

import { usePublicActions } from '../../../store';
import { useCreateFolderModal } from '../../modals/CreateFolderModal';

interface Props {
    token: string;
    linkId: string;
}

export const CreateButton = ({ token, linkId }: Props) => {
    const { createFolder } = usePublicActions();
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModal();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <Button
                ref={anchorRef}
                onClick={toggle}
                className="flex gap-2 py-2 items-start justify-center text-left flex-column md:gap-4 md:py-3"
                size="medium"
            >
                <Icon name="plus" size={4} />
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
                </DropdownMenu>
            </Dropdown>
            {createFolderModal}
        </>
    );
};
