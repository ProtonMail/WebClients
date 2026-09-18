import type { FC } from 'react';

import { c } from 'ttag';

import { useRequest } from '../../hooks/useRequest';
import { folderEdit } from '../../store/actions';
import { FolderFormModal } from './FolderFormModal';

interface Props {
    shareId: string;
    folderId: string;
    folderName: string;
    onClose: () => void;
}

export const FolderEditModal: FC<Props> = ({ shareId, folderId, folderName, onClose }) => {
    const { loading, dispatch } = useRequest(folderEdit, { onSuccess: onClose });

    return (
        <FolderFormModal
            title={c('Title').t`Rename folder`}
            submitText={c('Action').t`Save`}
            initialName={folderName}
            loading={loading}
            onSubmit={(name) => dispatch({ shareId, folderId, name })}
            onClose={onClose}
        />
    );
};
