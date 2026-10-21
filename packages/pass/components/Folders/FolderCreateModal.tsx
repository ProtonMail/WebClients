import type { FC } from 'react';

import { c } from 'ttag';

import MiddleEllipsis from '@proton/components/components/ellipsis/MiddleEllipsis';

import { useMemoSelector } from '../../hooks/useMemoSelector';
import { useRequest } from '../../hooks/useRequest';
import { folderCreate } from '../../store/actions/creators/folders';
import { selectFolder } from '../../store/selectors/folders';
import { selectShare } from '../../store/selectors/shares';
import type { ShareType } from '../../types/data/shares';
import { useSelectFolder } from '../Navigation/NavigationActions';
import { FolderFormModal } from './FolderFormModal';

interface Props {
    shareId: string;
    parentFolderId: string | null;
    onClose: () => void;
}

export const FolderCreateModal: FC<Props> = ({ shareId, parentFolderId, onClose }) => {
    const navigateToFolder = useSelectFolder();

    const { loading, dispatch } = useRequest(folderCreate, {
        onSuccess: ({ shareId, folder }) => {
            navigateToFolder(shareId, folder.folderId);
            onClose();
        },
    });
    const parentFolder = useMemoSelector(selectFolder, [shareId, parentFolderId]);
    const vault = useMemoSelector(selectShare<ShareType.Vault>, [shareId]);

    const folderName = parentFolder ? (
        <MiddleEllipsis key="folderName" text={parentFolder.name} splitOnlyTooLong />
    ) : null;
    const vaultName = <MiddleEllipsis key="vaultName" text={vault?.content.name ?? ''} splitOnlyTooLong />;

    const title = folderName
        ? c('Title').jt`Create subfolder in "${folderName}"`
        : c('Title').jt`Create folder in "${vaultName}"`;

    return (
        <FolderFormModal
            title={title}
            submitText={c('Action').t`Create`}
            loading={loading}
            onSubmit={(name) => dispatch({ shareId, parentFolderId, name })}
            onClose={onClose}
        />
    );
};
