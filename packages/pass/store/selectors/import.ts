import type { ImportState } from '../reducers';
import type { State } from '../types';

export const selectImportReport = (state: State): ImportState => state.import;
