import { ApiImportProvider } from '../api/api.interface';
import { ImportType } from '../interface';

/** Telemetry dimension values for the import provider */
export const telemetryProvider = {
    [ApiImportProvider.GOOGLE]: 'google',
    [ApiImportProvider.OUTLOOK]: 'outlook',
    [ApiImportProvider.IMAP]: 'imap',
} as const satisfies Record<ApiImportProvider, string>;

/** Telemetry dimension values for the imported product */
export const telemetryProduct = {
    [ImportType.MAIL]: 'mail',
    [ImportType.CALENDAR]: 'calendar',
    [ImportType.CONTACTS]: 'contacts',
    [ImportType.DRIVE]: 'drive',
} as const satisfies Record<ImportType, string>;
