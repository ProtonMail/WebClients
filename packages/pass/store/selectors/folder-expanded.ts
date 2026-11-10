import type { State } from '../types';

export const selectIsFolderExpanded = (id: string) => (state: State) => state.folderExpanded[id] === true;
