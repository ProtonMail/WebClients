import { EVENT_ACTIONS } from '@proton/shared/lib/constants';

import { ApiImporter, ApiReport } from './api.types';

interface ApiEventType {
    ID: string;
    Action: EVENT_ACTIONS;
}

export interface ApiEvent {
    More?: 0 | 1;
    EventID?: string;
    Refresh?: number;
    Imports?: ApiImportEvent[];
    ImportReports?: ApiImportReportEvent[];
}

export interface ApiImportReportEvent extends ApiEventType {
    ImportReport?: ApiReport;
}

export interface ApiImportEvent extends ApiEventType {
    Importer?: ApiImporter;
}
