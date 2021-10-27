export const queryContacts = ({
    Page = 0,
    PageSize = 1000,
    LabelID,
}: {
    Page?: number;
    PageSize?: number;
    LabelID?: string;
} = {}) => ({
    url: 'contacts/v4/contacts',
    method: 'get',
    params: { Page, PageSize, LabelID },
});

export const queryContactExport = ({
    Page = 0,
    PageSize = 50,
    LabelID,
}: {
    Page?: number;
    PageSize?: number;
    LabelID?: string;
} = {}) => ({
    url: 'contacts/v4/contacts/export',
    method: 'get',
    params: { Page, PageSize, LabelID },
});

export const getContact = (contactID: string) => ({
    url: `contacts/v4/contacts/${contactID}`,
    method: 'get',
});

interface Card {
    Type: number;
    Data: string;
    Signature: string | null;
}

export const addContacts = ({
    Contacts,
    Overwrite,
    Labels,
    Import,
}: {
    Contacts: {
        Cards: Card[];
    }[];
    Overwrite: 0 | 1;
    Import?: 0 | 1;
    Labels?: number;
    timeout?: number;
}) => ({
    url: 'contacts/v4/contacts',
    method: 'post',
    data: { Contacts, Overwrite, Labels, Import },
});

export const updateContact = (contactID: string, { Cards }: { Cards: Card[] }) => ({
    url: `contacts/v4/contacts/${contactID}`,
    method: 'put',
    data: { Cards },
});

export const labelContacts = ({ LabelID, ContactIDs }: { LabelID: string; ContactIDs: string[] }) => ({
    url: 'contacts/v4/contacts/label',
    method: 'put',
    data: { LabelID, ContactIDs },
});

export const unLabelContacts = ({ LabelID, ContactIDs }: { LabelID: string; ContactIDs: string[] }) => ({
    url: 'contacts/v4/contacts/unlabel',
    method: 'put',
    data: { LabelID, ContactIDs },
});

export const deleteContacts = (IDs: string[]) => ({
    url: 'contacts/v4/contacts/delete',
    method: 'put',
    data: { IDs },
});

export const clearContacts = () => ({
    url: 'contacts/v4/contacts',
    method: 'delete',
});

export const queryContactEmails = ({
    Page,
    PageSize,
    Email,
    LabelID,
}: {
    Page?: number;
    PageSize?: number;
} & (
    | {
          Email?: string;
          LabelID?: never;
      }
    | {
          Email?: never;
          LabelID?: string;
      }
) = {}) => ({
    url: 'contacts/v4/contacts/emails',
    method: 'get',
    params: { Page, PageSize, Email, LabelID },
});

export const labelContactEmails = ({ LabelID, ContactEmailIDs }: { LabelID: string; ContactEmailIDs: string[] }) => ({
    url: 'contacts/v4/contacts/emails/label',
    method: 'put',
    data: { LabelID, ContactEmailIDs },
});

export const unLabelContactEmails = ({ LabelID, ContactEmailIDs }: { LabelID: string; ContactEmailIDs: string[] }) => ({
    url: 'contacts/v4/contacts/emails/unlabel',
    method: 'put',
    data: { LabelID, ContactEmailIDs },
});
