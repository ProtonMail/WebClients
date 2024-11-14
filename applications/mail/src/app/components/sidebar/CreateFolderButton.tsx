import { useCallback } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { DropdownMenuButton } from '@proton/components';
import { hasReachedFolderLimit } from '@proton/shared/lib/helpers/folder';
import type { Folder } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useLabelActionsContext } from './EditLabelContext';

interface Props {
    folders: Folder[];
    className?: string;
    parentFolderId?: string;
    onShowUpsellModal: () => void;
}

const CreateFolderButton = ({ folders, className, parentFolderId, onShowUpsellModal }: Props) => {
    const [user] = useUser();
    const { createLabel } = useLabelActionsContext();
    const canCreateFolder = !hasReachedFolderLimit(user, folders || []);

    const handleCreate = useCallback(() => {
        if (canCreateFolder) {
            createLabel('folder', parentFolderId);
        } else {
            onShowUpsellModal();
        }
    }, [canCreateFolder, createLabel, parentFolderId, onShowUpsellModal]);

    return (
        <DropdownMenuButton className={clsx('text-left', className)} onClick={handleCreate}>
            {c('Action').t`Create a new folder`}
        </DropdownMenuButton>
    );
};

export default CreateFolderButton;
