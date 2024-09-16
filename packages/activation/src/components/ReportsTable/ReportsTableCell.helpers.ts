import { c } from 'ttag';

import { ImportType } from '@proton/activation/src/interface';
import type { IconName } from '@proton/components/components/icon/Icon';

export const getImportProductName = (type: ImportType) => {
    switch (type) {
        case ImportType.MAIL:
            return c('Import type').t`Mail`;
        case ImportType.CALENDAR:
            return c('Import type').t`Calendar`;
        case ImportType.CONTACTS:
            return c('Import type').t`Contacts`;
    }
};

export const getImportIconNameByProduct = (type: ImportType, isSync?: boolean): IconName => {
    if (isSync) {
        return 'arrows-rotate';
    }

    switch (type) {
        case ImportType.MAIL:
            return 'envelope';
        case ImportType.CALENDAR:
            return 'calendar-grid';
        case ImportType.CONTACTS:
            return 'users';
    }
};
