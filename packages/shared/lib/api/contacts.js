export const queryContacts = ({ Page = 0, PageSize = 1000, LabelID } = {}) => ({
    url: 'contacts',
    method: 'get',
    params: { Page, PageSize, LabelID }
});

export const queryContactExport = ({ Page = 0, PageSize = 1000, LabelID } = {}) => ({
    url: 'contacts/export',
    method: 'get',
    params: { Page, PageSize, LabelID }
});

export const getContact = (contactID) => ({
    url: `contacts/${contactID}`,
    method: 'get'
});

export const addContacts = ({ Contacts, Overwrite, Labels } = {}) => ({
    url: 'contacts',
    method: 'post',
    data: { Contacts, Overwrite, Labels }
});

export const updateContact = (contactID, { Cards } = {}) => ({
    url: `contacts/${contactID}`,
    method: 'put',
    data: { Cards }
});

export const labelContacts = ({ LabelID, ContactIDs } = {}) => ({
    url: 'contacts/label',
    method: 'put',
    data: { LabelID, ContactIDs }
});

export const unLabelContacts = ({ LabelID, ContactIDs } = {}) => ({
    url: 'contacts/unlabel',
    method: 'put',
    data: { LabelID, ContactIDs }
});

export const deleteContacts = (IDs) => ({
    url: 'contacts/delete',
    method: 'put',
    data: { IDs }
});

export const clearContacts = () => ({
    url: 'contacts',
    method: 'delete'
});

export const queryContactEmails = ({ Page, PageSize, Email, LabelID } = {}) => ({
    url: 'contacts/emails',
    method: 'get',
    params: { Page, PageSize, Email, LabelID }
});

export const labelContactEmails = ({ LabelID, ContactEmailIDs } = {}) => ({
    url: 'contacts/emails/label',
    method: 'put',
    data: { LabelID, ContactEmailIDs }
});

export const unLabelContactEmails = ({ LabelID, ContactEmailIDs } = {}) => ({
    url: 'contacts/emails/unlabel',
    method: 'put',
    data: { LabelID, ContactEmailIDs }
});
