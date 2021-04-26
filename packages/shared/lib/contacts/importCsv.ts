import { PreVcardProperty, PreVcardsContact } from '../interfaces/contacts/Import';
import { VCardKey } from '../interfaces/contacts/VCard';
import { getTypeValues } from '../helpers/contacts';

// See './csv.ts' for the definition of pre-vCard and pre-vCards contact

/**
 * Modify the field (and accordingly the type, if needed) of a pre-vCard
 */
const modifyPreVcardField = (preVcard: PreVcardProperty, newField: VCardKey) => {
    const types = getTypeValues();
    const type = types[newField] as VCardKey[];
    const newType = type.includes((preVcard.type || '') as VCardKey)
        ? preVcard.type
        : type.length
        ? type[0]
        : undefined;

    return { ...preVcard, field: newField, type: newType, custom: false };
};

/**
 * Modify the field (and accordingly the type) of a pre-vCard inside a pre-vCards contact
 */
export const modifyContactField = (preVcardsContact: PreVcardsContact, index: number, newField: VCardKey) => {
    return preVcardsContact.map((preVcards, i) =>
        i !== index ? preVcards : preVcards.map((preVcard) => modifyPreVcardField(preVcard, newField))
    );
};

/**
 * Modify the type of a pre-vCard
 */
const modifyPreVcardType = (preVcard: PreVcardProperty, newType: string) => ({ ...preVcard, type: newType });

/**
 * Modify the type of a pre-vCard inside a pre-vCards contact
 */
export const modifyContactType = (preVcardsContact: PreVcardsContact, index: number, newField: string) => {
    return preVcardsContact.map((preVcards, i) =>
        i !== index ? preVcards : preVcards.map((preVcard) => modifyPreVcardType(preVcard, newField))
    );
};

/**
 * Toggle the checked attribute of a pre-vCard inside a pre-vCards contact
 * @param {Object} preVcardsContact     A pre-vCards contact
 * @param {Number} groupIndex           The index of the group of pre-Vcards where the pre-vCard to be modified is
 * @param {Number} index                The index of the pre-vCard within the group of pre-vCards
 *
 * @return {Array<Array<Object>>}       the pre-vCards contact with the modified pre-vCard
 */
export const toggleContactChecked = (preVcardsContact: PreVcardsContact, [groupIndex, index]: number[]) => {
    const toggleFN = preVcardsContact[groupIndex][index].combineInto === 'fn-main';
    const groupIndexN = toggleFN ? preVcardsContact.findIndex((group) => group[0].combineInto === 'n') : -1;

    return preVcardsContact.map((preVcards, i) => {
        if (i === groupIndex) {
            return preVcards.map((preVcard, j) =>
                j !== index ? preVcard : { ...preVcard, checked: !preVcard.checked }
            );
        }
        if (toggleFN && i === groupIndexN) {
            // When FN components are toggled, we also toggle the corresponding N components
            const headerFN = preVcardsContact[groupIndex][index].header;
            const indexN = preVcardsContact[groupIndexN].findIndex(({ header }) => header === headerFN);
            return preVcards.map((preVcard, j) =>
                j !== indexN ? preVcard : { ...preVcard, checked: !preVcard.checked }
            );
        }
        return preVcards;
    });
};
