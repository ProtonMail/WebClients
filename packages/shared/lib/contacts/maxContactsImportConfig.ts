const DEFAULT_MAX_CONTACTS_IMPORT = 100_000;

let getMaxContactsImportConfigImpl = () => DEFAULT_MAX_CONTACTS_IMPORT;

export const setMaxContactsImportConfig = (getter: () => number) => {
    getMaxContactsImportConfigImpl = getter;
};

export const resetMaxContactsImportConfig = () => {
    getMaxContactsImportConfigImpl = () => DEFAULT_MAX_CONTACTS_IMPORT;
};

export const getMaxContactsImportConfig = () => getMaxContactsImportConfigImpl();
