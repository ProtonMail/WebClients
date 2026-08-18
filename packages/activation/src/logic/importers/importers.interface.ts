import type { ApiImporter, ApiImporterActive, ApiImporterFolder } from '../../api/api.interface';
import type { ImportType } from '../../interface';

/**
 * TODO: Change typing depending on IMAP and OAUTH context
 */
export type Importer = {
    ID: ApiImporter['ID'];
    account: ApiImporter['Account'];
    products: ApiImporter['Product'];
    /** Only on IMAP flow */
    sasl?: ApiImporter['Sasl'];
    provider: ApiImporter['Provider'];
};

/**
 * Active importers don't have ID returned by API
 * We define it by using import ImporterID and ImportType
 */
export type ActiveImportID = `${Importer['ID']}-${ImportType}`;
export type ActiveImporter = {
    localID: ActiveImportID;
    importerID: ApiImporter['ID'];
    product: ImportType;
    errorCode?: ApiImporterActive['ErrorCode'];
    importState: ApiImporterActive['State'];
    mapping?: ApiImporterFolder[];
    startDate: ApiImporterActive['CreateTime'];
    total?: ApiImporterActive['Total'];
    importedBytes?: ApiImporterActive['ImportedBytes'];
};

export type ImportersMap = Record<string, Importer>;
export type ActiveImportersMap = Record<ActiveImportID, ActiveImporter>;

export interface ImportersState {
    importers: ImportersMap;
    activeImporters: ActiveImportersMap;
    loading: 'idle' | 'pending' | 'success' | 'failed';
}
