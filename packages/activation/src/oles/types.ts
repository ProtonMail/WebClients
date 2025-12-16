import type { Domain } from '@proton/shared/lib/interfaces';

import type { ApiImporterProduct } from '../api/api.interface';

export type Product = ApiImporterProduct;

export type TimePeriod = 'all' | '1yr' | '2yr' | '5yr';

export type MigrationConfiguration = {
    selectedProducts: Product[];
    notifyList: string[];
    timePeriod: TimePeriod;
    domain: Domain | undefined;
    importerOrganizationId: string | undefined;
};

export type MigrationSetupModel = MigrationConfiguration & {
    setNotifyList: (emails: string[]) => void;
    setTimePeriod: (period: TimePeriod) => void;
    setSelectedProducts: (products: Product[]) => void;
};
