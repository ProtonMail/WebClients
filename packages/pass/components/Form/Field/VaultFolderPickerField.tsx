import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { useFormikContext } from 'formik';

import { selectFolders, selectWritableVaults } from '../../../store/selectors';
import type { BaseItemValues } from '../../../types/forms';
import { useFoldersAccess } from '../../Folders/useFoldersAccess';
import { VaultFolderPickerFieldCore } from './VaultFolderPickerFieldCore';

export const VaultFolderPickerField: FC = () => {
    const { values, setFieldValue } = useFormikContext<BaseItemValues>();
    const vaults = useSelector(selectWritableVaults);
    const folders = useSelector(selectFolders);
    const { canUseFolders } = useFoldersAccess();

    return (
        <VaultFolderPickerFieldCore
            vaults={vaults}
            folders={folders}
            showFolders={canUseFolders}
            shareId={values.shareId}
            folderId={values.folderId}
            onChange={(shareId, folderId) => {
                void setFieldValue('shareId', shareId);
                void setFieldValue('folderId', folderId);
            }}
        />
    );
};
