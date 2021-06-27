import Papa from 'papaparse';

import isTruthy from '../../helpers/isTruthy';
import { ContactProperties } from '../../interfaces/contacts';
import { sortByPref } from '../properties';
import {
    ContactPropertyWithDisplay,
    ParsedCsvContacts,
    PreVcardProperty,
    PreVcardsContact,
    PreVcardsProperty,
} from '../../interfaces/contacts/Import';
import { standarize, combine, display, toPreVcard } from './csvFormat';
import { range } from '../../helpers/array';

interface PapaParseOnCompleteArgs {
    data?: string[][];
    errors?: any[];
}

/**
 * Get all csv properties and corresponding contacts values from a csv file.
 * If there are errors when parsing the csv, throw
 * @dev  contacts[i][j] : value for property headers[j] of contact i
 */
export const readCsv = async (file: File) => {
    const {
        headers,
        contacts: parsedContacts,
        errors,
    }: { headers: string[]; contacts: string[][]; errors: any[] } = await new Promise((resolve, reject) => {
        const onComplete = ({ data = [], errors = [] }: PapaParseOnCompleteArgs = {}) =>
            resolve({ headers: data[0], contacts: data.slice(1), errors });

        Papa.parse(file, {
            // If true, the first row of parsed data will be interpreted as field names. An array of field names will be returned in meta,
            // and each row of data will be an object of values keyed by field name instead of a simple array.
            // Rows with a different number of fields from the header row will produce an error.
            header: false,
            // If true, numeric and Boolean data will be converted to their type instead of remaining strings.
            dynamicTyping: false,
            complete: onComplete,
            error: reject,
            // If true, lines that are completely empty will be skipped. An empty line is defined to be one which evaluates to empty string.
            skipEmptyLines: true,
        });
    });

    if (errors.length) {
        throw new Error('Error when reading csv file');
    }

    // Papaparse will produce data according to the CSV content
    // There is no security about having same numbers of fields on all lines
    // So we do a pass of sanitization to clean up data

    const headersLength = headers.length;
    const contacts = parsedContacts.map((contact) => {
        if (contact.length === headersLength) {
            return contact;
        }
        if (contact.length > headersLength) {
            return contact.slice(0, headersLength);
        }
        return [...contact, ...range(0, headersLength - contact.length).map(() => '')];
    });

    return { headers, contacts };
};

/**
 * Transform csv properties and csv contacts into pre-vCard contacts.
 * @param {Object} csvData
 * @param {Array<String>} csvData.headers           Array of csv properties
 * @param {Array<Array<String>>} csvData.contacts   Array of csv contacts
 *
 * @return {Array<Array<Object>>}                   pre-vCard contacts
 *
 * @dev  Some csv property may be assigned to several pre-vCard contacts,
 *       so an array of new headers is returned together with the pre-vCard contacts
 */
const parse = ({ headers = [], contacts = [] }: ParsedCsvContacts): PreVcardsProperty[] => {
    if (!contacts.length) {
        return [];
    }
    const { headers: enrichedHeaders, contacts: standardContacts } = standarize({ headers, contacts }) || {};
    if (!enrichedHeaders?.length || !standardContacts?.length) {
        return [];
    }

    const translator = enrichedHeaders.map(toPreVcard);

    return standardContacts
        .map((contact) =>
            contact
                .map((value, i) => translator[i](value))
                // some headers can be mapped to several properties, so we need to flatten
                .flat()
        )
        .map((contact) => contact.filter((preVcard) => !!preVcard)) as PreVcardsProperty[];
};

/**
 * Transform csv properties and csv contacts into pre-vCard contacts,
 * re-arranging them in the process
 *
 * @dev  headers are arranged as headers = [[group of headers to be combined in a vCard], ...]
 *       preVcardContacts is an array of pre-vCard contacts, each of them containing pre-vCards
 *       arranged in the same way as the headers:
 *       preVcardContacts = [[[group of pre-vCard properties to be combined], ...], ...]
 */
export const prepare = ({ headers = [], contacts = [] }: ParsedCsvContacts) => {
    const preVcardContacts = parse({ headers, contacts });
    if (!preVcardContacts.length) {
        return [];
    }

    // detect csv properties to be combined in preVcardContacts and split header indices
    const nonCombined: number[] = [];
    const combined = preVcardContacts[0].reduce<{ [key: string]: number[] }>(
        (acc, { combineInto, combineIndex: j }, i) => {
            if (combineInto) {
                if (!acc[combineInto]) {
                    acc[combineInto] = [];
                }
                acc[combineInto][j as number] = i;
                // combined will look like e.g.
                // { 'fn-main': [2, <empty item(s)>, 3, 5, 1], 'fn-yomi': [<empty item(s)>, 6, 7] }
                return acc;
            }
            nonCombined.push(i);
            return acc;
        },
        {}
    );

    for (const combination of Object.keys(combined)) {
        // remove empty items from arrays in combined
        combined[combination] = combined[combination].filter((n) => n !== null);
    }

    // Arrange pre-vCards respecting the original ordering outside header groups
    const preparedPreVcardContacts: PreVcardsContact[] = contacts.map(() => []);
    for (const [i, indices] of Object.values(combined).entries()) {
        preparedPreVcardContacts.forEach((contact) => contact.push([]));
        indices.forEach((index) => {
            preparedPreVcardContacts.forEach((contact, k) =>
                contact[i].push({
                    ...preVcardContacts[k][index],
                })
            );
        });
    }
    for (const index of nonCombined) {
        preparedPreVcardContacts.forEach((contact, k) => contact.push([preVcardContacts[k][index]]));
    }

    return preparedPreVcardContacts;
};

/**
 * Combine pre-vCards properties into a single vCard one
 * @param {Array} preVcards     Array of pre-vCards properties
 *
 * @return {Object}             vCard property
 */
export const toVcard = (preVcards: PreVcardProperty[]): ContactPropertyWithDisplay | undefined => {
    if (!preVcards.length) {
        return;
    }
    const { pref, field, type, custom } = preVcards[0];
    return custom
        ? { pref, field, type, value: combine.custom(preVcards), display: display.custom(preVcards) }
        : { pref, field, type, value: combine[field](preVcards), display: display[field](preVcards) };
};

/**
 * Transform pre-vCards contacts into vCard contacts
 */
export const toVcardContacts = (preVcardsContacts: PreVcardsContact[]): ContactProperties[] =>
    preVcardsContacts.map((preVcardsContact) => preVcardsContact.map(toVcard).filter(isTruthy).sort(sortByPref));
