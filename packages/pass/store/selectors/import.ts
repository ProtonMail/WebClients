import type { ImportState } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';

export const selectImportReport = (state: State): ImportState => state.import;
