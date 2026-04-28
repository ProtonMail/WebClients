import { c } from 'ttag';

import type { ApiImportProvider } from '@proton/activation/src/api/api.interface';
import { getImportProviderFromApiProvider } from '@proton/activation/src/helpers/getImportProviderFromApiProvider';
import { ImportType } from '@proton/activation/src/interface';
import type { IconName } from '@proton/icons/types';
import capitalize from '@proton/utils/capitalize';

export const getImportProductName = (apiProvider: ApiImportProvider, type: ImportType, isForwardingOnly?: boolean) => {
    const provider = getImportProviderFromApiProvider(apiProvider);

    const importTypeLabels: Record<ImportType, string> = {
        [ImportType.MAIL]: c('Import type').t`Mail`,
        [ImportType.CALENDAR]: c('Import type').t`Calendar`,
        [ImportType.CONTACTS]: c('Import type').t`Contacts`,
    };

    return `${capitalize(provider)} ${importTypeLabels[type]}${isForwardingOnly ? ' (forwarding only)' : ''}`;
};

export const getImportIconNameByProduct = (type: ImportType): IconName => {
    switch (type) {
        case ImportType.MAIL:
            return 'envelope';
        case ImportType.CALENDAR:
            return 'calendar-grid';
        case ImportType.CONTACTS:
            return 'users';
    }
};
