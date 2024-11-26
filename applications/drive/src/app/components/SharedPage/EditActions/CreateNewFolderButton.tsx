import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Icon } from '@proton/components/index';

import { usePublicActions } from '../../../store';
import { useCreateFolderModal } from '../../modals/CreateFolderModal';

interface Props {
    token: string;
    linkId: string;
}

export const CreateNewFolderButton = ({ token, linkId }: Props) => {
    const { createFolder } = usePublicActions();
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModal();

    return (
        <>
            <Button
                onClick={() =>
                    showCreateFolderModal({
                        folder: {
                            shareId: token,
                            linkId,
                        },
                        createFolder,
                    })
                }
                className="flex flex-column py-3 w-custom"
                style={{
                    '--w-custom': '8.25rem',
                }}
                size="medium"
            >
                <Icon name="folder" size={4} className="mb-4" />
                {c('Action').t`Create a folder`}
            </Button>
            {createFolderModal}
        </>
    );
};
