import { c } from 'ttag';

import type { IconComponent } from '@proton/icons/component';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcUsers } from '@proton/icons/icons/IcUsers';
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

/**
 * Unused in production — `ReportsTableIcon` renders product logos instead, and
 * only this module's test still exercises this. A candidate for removal.
 */
export const getImportIconByProduct = (type: ImportType): IconComponent => {
    switch (type) {
        case ImportType.MAIL:
            return IcEnvelope;
        case ImportType.CALENDAR:
            return IcCalendarGrid;
        case ImportType.CONTACTS:
            return IcUsers;
        case ImportType.DRIVE:
            return IcBrandProtonDrive;
    }
};
