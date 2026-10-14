import { c } from 'ttag';

import capitalize from '@proton/utils/capitalize';

import type { ApiImportProvider } from '../../api/api.interface';
import { getImportProviderFromApiProvider } from '../../helpers/getImportProviderFromApiProvider';
import { ImportType } from '../../interface';

export const getImportProductName = (apiProvider: ApiImportProvider, type: ImportType, isForwardingOnly?: boolean) => {
    const provider = getImportProviderFromApiProvider(apiProvider);

    const importTypeLabels: Record<ImportType, string> = {
        [ImportType.MAIL]: c('Import type').t`Mail`,
        [ImportType.CALENDAR]: c('Import type').t`Calendar`,
        [ImportType.CONTACTS]: c('Import type').t`Contacts`,
        [ImportType.DRIVE]: c('Import type').t`Drive`,
    };

    return `${capitalize(provider)} ${importTypeLabels[type]}${isForwardingOnly ? ' (forwarding only)' : ''}`;
};
