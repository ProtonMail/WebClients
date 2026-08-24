import { useCallback, useMemo, useState } from 'react';
import { useStore } from 'react-redux';

import { filesFormInitializer } from '../../lib/file-attachments/helpers';
import { fileRestore } from '../../store/actions';
import { selectItem } from '../../store/selectors';
import { selectItemFilesForRevision } from '../../store/selectors/files';
import type { State } from '../../store/types';
import type { FileID, FileRestoreDTO, SelectedRevision } from '../../types';
import { prop } from '../../utils/fp/lens';
import { useMemoSelector } from '../useMemoSelector';
import { useRequestDispatch } from '../useRequest';

export const useFileRevision = ({ shareId, itemId, revision }: SelectedRevision) => {
    const store = useStore<State>();
    const files = useMemoSelector(selectItemFilesForRevision, [shareId, itemId, revision]);

    const restore = useRequestDispatch(fileRestore);
    const [restoring, setRestoring] = useState<Set<string>>(new Set());

    const setFileLoading = useCallback((fileID: FileID, loading: boolean) => {
        if (loading) setRestoring((prev) => new Set(prev).add(fileID));
        else {
            setRestoring((prev) => {
                const next = new Set(prev);
                next.delete(fileID);
                return next;
            });
        }
    }, []);

    const restoreFile = useCallback(async (dto: FileRestoreDTO) => {
        try {
            setFileLoading(dto.fileId, true);
            await restore(dto);
        } catch {
        } finally {
            setFileLoading(dto.fileId, false);
        }
    }, []);

    return useMemo(
        () => ({
            files,
            restoring,
            restoreFile,
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
        }),
        [files, restoring]
    );
};
