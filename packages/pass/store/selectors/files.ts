import { createSelector } from '@reduxjs/toolkit';

import { isFileForRevision } from '../../lib/file-attachments/helpers';
import type { FileDescriptor } from '../../types';
import type { State } from '../types';

const selectFiles = (state: State) => state.files;

const selectItemFiles = (shareId: string, itemId: string) =>
    createSelector([selectFiles], (files): FileDescriptor[] => files?.[shareId]?.[itemId] ?? []);

export const selectItemFilesForRevision = (shareId: string, itemId: string, revision: number) =>
    createSelector(selectItemFiles(shareId, itemId), (files) => files.filter(isFileForRevision(revision)));
