import { ApiSyncState } from '@proton/activation/api/api.interface';
import { ImportType } from '@proton/activation/interface';

export type Sync = {
    account: string;
    id: string;
    importerID: string;
    product: ImportType;
    state: ApiSyncState;
    startDate: number;
};

export type SyncMap = Record<string, Sync>;

export type LoadingState = 'idle' | 'pending' | 'success' | 'failed';

export interface SyncState {
    syncs: SyncMap;
    creatingLoading: LoadingState;
    listLoading: LoadingState;
    apiErrorCode?: number;
    apiErrorLabel?: string;
}
