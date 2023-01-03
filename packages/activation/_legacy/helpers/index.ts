// This function returns an array of ImportType give a checked product map
import { CheckedProductMap, IAOauthModalModelImportData, ImportType } from '@proton/activation/interface';

const { MAIL, CONTACTS, CALENDAR } = ImportType;

// e.g. { [MAIL]: true, [CALENDAR]: false } => [CALENDAR]
export const getCheckedProducts = (checkedTypes: CheckedProductMap): ImportType[] =>
    (Object.keys(checkedTypes) as ImportType[]).reduce<ImportType[]>((acc, k) => {
        if (checkedTypes[k]) {
            return [...acc, k];
        }

        return acc;
    }, []);

export const hasDataToImport = (data: IAOauthModalModelImportData, checkedProducts: ImportType[]) => {
    const hasMailData = checkedProducts.includes(MAIL) && data[MAIL].providerFolders.length > 0;
    const hasCalendarData = checkedProducts.includes(CALENDAR) && data[CALENDAR].providerCalendars.length > 0;
    const hasContactsData =
        checkedProducts.includes(CONTACTS) && (data[CONTACTS].numContacts || data[CONTACTS].numContactGroups);

    return hasMailData || hasCalendarData || hasContactsData;
};
