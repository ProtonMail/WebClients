import {
    ContactCard,
    ContactGroup,
    ContactMetadata,
    ContactProperties,
    ContactProperty,
    ContactValue,
} from './Contact';
import { VCardKey } from './VCard';
import { ImportContactError } from '../../contacts/errors/ImportContactError';
import { ImportFatalError } from '../../contacts/errors/ImportFatalError';
import { ImportFileError } from '../../contacts/errors/ImportFileError';

export enum IMPORT_STEPS {
    ATTACHING,
    ATTACHED,
    IMPORT_CSV,
    WARNING,
    IMPORTING,
    SUMMARY,
    IMPORT_GROUPS,
    FINISHED,
}

export enum IMPORT_GROUPS_ACTION {
    MERGE,
    CREATE,
    IGNORE,
}

export enum EXTENSION {
    CSV = 'csv',
    VCF = 'vcf',
}

export type ACCEPTED_EXTENSIONS = EXTENSION.CSV | EXTENSION.VCF;

export interface ParsedCsvContacts {
    headers: string[];
    contacts: string[][];
}

export interface ContactPropertyWithDisplay extends ContactProperty {
    display: string;
}

export interface ImportCategories {
    name: string;
    totalContacts: number;
    contactIDs: string[];
    contactEmailIDs: string[];
    action: IMPORT_GROUPS_ACTION;
    targetGroup: ContactGroup;
    targetName: string;
    error?: string;
}

export interface ImportContactsModel {
    step: IMPORT_STEPS;
    fileAttached?: File;
    extension?: ACCEPTED_EXTENSIONS;
    preVcardsContacts?: PreVcardsContact[];
    parsedVcardContacts: ContactProperties[];
    importedContacts: ImportedContact[];
    totalEncrypted: number;
    totalImported: number;
    errors: ImportContactError[];
    failure?: ImportFatalError | ImportFileError | Error;
    loading: boolean;
    contactGroups?: ContactGroup[];
    categories: ImportCategories[];
}

export interface EncryptedContact {
    contact: { Cards: ContactCard[]; error?: Error };
    contactEmails: { email: string; group?: string }[];
    categories: { name: string; group?: string }[];
    contactId: string;
}

export interface ImportedContact {
    contactID: string;
    contactEmailIDs: string[];
    categories: { name: string; contactEmailIDs?: string[] }[];
}

export interface AddContactsApiResponse {
    Index: number;
    Response: {
        Code: number;
        Contact?: ContactMetadata;
        Error?: string;
    };
}

export interface AddContactsApiResponses {
    Code: number;
    Responses: AddContactsApiResponse[];
}

export interface Combine {
    [key: string]: (preVcards: PreVcardsProperty) => ContactValue;
}

export interface Display {
    [key: string]: (preVcards: PreVcardsProperty) => string;
}

export interface PreVcardProperty {
    header: string;
    checked: boolean;
    pref?: number;
    field: string;
    type?: VCardKey;
    value: ContactValue;
    combineInto?: string;
    combineIndex?: number;
    custom?: boolean;
}

export type PreVcardsProperty = PreVcardProperty[];

export type PreVcardsContact = PreVcardsProperty[];
