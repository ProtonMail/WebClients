import type { ImportContactError } from '../../contacts/errors/ImportContactError';
import type { ImportFatalError } from '../../contacts/errors/ImportFatalError';
import type { ImportFileError } from '../../contacts/errors/ImportFileError';
import type { ContactCard, ContactGroup, ContactValue } from './Contact';
import type { VCardContact, VCardKey } from './VCard';

export enum IMPORT_STEPS {
    ATTACHING = 0,
    ATTACHED = 1,
    IMPORT_CSV = 2,
    WARNING = 3,
    IMPORTING = 4,
    SUMMARY = 5,
    IMPORT_GROUPS = 6,
}

export enum IMPORT_GROUPS_ACTION {
    MERGE = 0,
    CREATE = 1,
    IGNORE = 2,
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
    parsedVcardContacts: VCardContact[];
    importedContacts: ImportedContact[];
    totalEncrypted: number;
    totalImported: number;
    errors: ImportContactError[];
    failure?: ImportFatalError | ImportFileError | Error;
    loading: boolean;
    contactGroups?: ContactGroup[];
    categories: ImportCategories[];
}

export interface SimpleEncryptedContact {
    contact: { Cards: ContactCard[]; error?: Error };
    contactId: string;
}

export interface EncryptedContact extends SimpleEncryptedContact {
    contactEmails: { email: string; group?: string }[];
    categories: { name: string; group?: string }[];
}

export interface ImportedContact {
    contactID: string;
    contactEmailIDs: string[];
    categories: { name: string; contactEmailIDs?: string[] }[];
}

export interface Combine {
    [key: string]: (preVcards: PreVcardsProperty) => any;
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
