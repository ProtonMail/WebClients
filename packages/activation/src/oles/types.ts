import type { ApiImporterProduct } from '../api/api.interface';

export type Product = ApiImporterProduct;

export type TimePeriod = 'all' | '1yr' | '2yr' | '5yr';

export type MigrationConfiguration = {
    selectedProducts: Product[];
    notifyList: string[];
    timePeriod: TimePeriod;
    domainName: string | undefined;
    importerOrganizationId: string | undefined;
    importOrganizationSettings: boolean;
};

export type MigrationSetupModel = MigrationConfiguration & {
    setNotifyList: (emails: string[]) => void;
    setTimePeriod: (period: TimePeriod) => void;
    setSelectedProducts: (products: Product[]) => void;
    setImportOrganizationSettings: (value: boolean) => void;
};
