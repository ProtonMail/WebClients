import type { Domain } from '@proton/shared/lib/interfaces/Domain';

import type { ApiImporterOrganizationState, ApiImporterProduct } from '../api/api.interface';
import type { ImportToken } from '../interface';
import type { CreateMigrationBatchError } from './thunk';
import type { ConnectionState } from './useConnectionState';

export type Product = ApiImporterProduct;

export type TimePeriod = 'all' | '1yr' | '2yr' | '5yr';

export type JoiningLink = {
    token: string;
    password: string;
    expirationTime: number;
};

export type MigrationConfiguration = {
    selectedProducts: Product[];
    notifyList: string[];
    timePeriod: TimePeriod;
    importerOrganizationId: string | undefined;
    importOrganizationSettings: boolean;
    joiningLink: JoiningLink | undefined;
    domainName: string | undefined;
    domain: Domain | undefined;
    domainRegistrarId: number;
    state: ApiImporterOrganizationState | undefined;
    tokens: ImportToken[] | undefined;
    connectionState: ConnectionState | undefined;
    transferErrors: CreateMigrationBatchError[];
};

export type MigrationModel = MigrationConfiguration & {
    importerOrganizationId: string;
    domainName: string;
    state: ApiImporterOrganizationState;
    update: (newState: Partial<MigrationModel>) => void;
};

export type MigrationSetupModel = MigrationConfiguration & {
    update: (newState: Partial<MigrationSetupModel>) => void;
};
