import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { fileRestore } from '@proton/pass/store/actions';
import { selectItemFilesForRevision } from '@proton/pass/store/selectors/files';
import type { FileRestoreDTO, SelectedRevision } from '@proton/pass/types';

export const useFileRevision = ({ shareId, itemId, revision }: SelectedRevision) => {
    const dispatch = useDispatch();
    const files = useMemoSelector(selectItemFilesForRevision, [shareId, itemId, revision]);

    return useMemo(
        () => ({
            files,
            getFilesToRestore: () => {
                return filesFormInitializer({});
                // TODO: reconciliate here
                // const filesToKeep = filteredFiles.filter(prop('disabled')).map(prop('fileUID'));
                // return filesFormInitializer({
                //     toRemove: files.filter((file) => !filesToKeep.includes(file.fileUID)).map(prop('fileID')),
                //     toRestore: filteredFiles.filter(not(prop('disabled'))).map(prop('fileID')),
                // });
            },
            restoreFile: (dto: FileRestoreDTO) => dispatch(fileRestore.intent(dto)),
        }),
        [files]
    );
};
