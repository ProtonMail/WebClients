import { c } from 'ttag';

import { IconName } from '@proton/components/components';
import { ImportType } from '@proton/shared/lib/interfaces/EasySwitch';

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
