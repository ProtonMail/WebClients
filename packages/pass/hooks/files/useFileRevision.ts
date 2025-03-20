import { useMemo } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { fileRestore } from '@proton/pass/store/actions';
import { selectItem } from '@proton/pass/store/selectors';
import { selectItemFilesForRevision } from '@proton/pass/store/selectors/files';
import type { State } from '@proton/pass/store/types';
import type { FileRestoreDTO, SelectedRevision } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';

export const useFileRevision = ({ shareId, itemId, revision }: SelectedRevision) => {
    const store = useStore<State>();
    const files = useMemoSelector(selectItemFilesForRevision, [shareId, itemId, revision]);
    const dispatch = useDispatch();

    return useMemo(
        () => ({
            files,
            getFilesToRestore: () => {
                const state = store.getState();

                const latestRevision = selectItem(shareId, itemId)(state)?.revision;
                if (!latestRevision) return filesFormInitializer({});

                const latestFiles = selectItemFilesForRevision(shareId, itemId, latestRevision)(state);

                /** Using `fileUIDs` to detect if file has already been restored or not. */
                const fileUIDs = files.map(prop('fileUID'));
                const latestFileUIDs = latestFiles.map(prop('fileUID'));

                const toRestore = files.filter((file) => !latestFileUIDs.includes(file.fileUID)).map(prop('fileID'));
                const toRemove = latestFiles.filter((file) => !fileUIDs.includes(file.fileUID)).map(prop('fileID'));

                return filesFormInitializer({ toRemove, toRestore });
            },
            restoreFile: (dto: FileRestoreDTO) => dispatch(fileRestore.intent(dto)),
        }),
        [files]
    );
};
