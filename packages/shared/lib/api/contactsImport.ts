// Manage imports of user contacts from external providers
export const createContactsImport = (data: any) => ({
    url: 'contacts/v4/importers',
    method: 'post',
    data,
});

export const startContactsImportJob = (importID: string, data: any) => ({
    url: `contacts/v4/importers/${importID}`,
    method: 'post',
    data,
});
