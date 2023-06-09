import type { ImportState } from '../reducers';
import type { State } from '../types';

export const selectLatestImport = (state: State): ImportState => state.import;
