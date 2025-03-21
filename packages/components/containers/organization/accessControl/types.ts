import { type APP_NAMES } from '@proton/shared/lib/constants';
import type { OrganizationSettingsAllowedProduct } from '@proton/shared/lib/interfaces';

export interface AccessControlApplication {
    title: string;
    appName: APP_NAMES;
    description: string;
    product: OrganizationSettingsAllowedProduct;
}
