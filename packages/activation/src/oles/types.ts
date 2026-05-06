import type { ApiImporterOrganizationState, ApiImporterProduct } from '../api/api.interface';

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
    domainName: string | undefined;
    importerOrganizationId: string | undefined;
    importOrganizationSettings: boolean;
    joiningLink: JoiningLink | undefined;
    state: ApiImporterOrganizationState;
};

export type MigrationModel = MigrationConfiguration & {
    update: (newState: MigrationConfiguration) => void;
};

export type MigrationSetupModel = MigrationConfiguration & {
    setNotifyList: (emails: string[]) => void;
    setTimePeriod: (period: TimePeriod) => void;
    setSelectedProducts: (products: Product[]) => void;
    setImportOrganizationSettings: (value: boolean) => void;
    setDomainName: (value: string | undefined) => void;
};
