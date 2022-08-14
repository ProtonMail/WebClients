import { ImportContactError } from '../../contacts/errors/ImportContactError';
import { ImportFatalError } from '../../contacts/errors/ImportFatalError';
import { ImportFileError } from '../../contacts/errors/ImportFileError';
import { ContactCard, ContactGroup, ContactValue } from './Contact';
import { VCardContact, VCardKey } from './VCard';

export enum IMPORT_STEPS {
    ATTACHING,
    ATTACHED,
    IMPORT_CSV,
    WARNING,
    IMPORTING,
    SUMMARY,
    IMPORT_GROUPS,
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
