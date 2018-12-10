import _ from 'lodash';
import Papa from 'papaparse';
import vCard from 'vcf';

import { getAllProperties, keys } from './csvFormat';

const properties = getAllProperties();
/**
 * Lowercase key contact
 * @param {Object} contact
 * @return {Object}
 */
const formatContact = (contact = {}) => {
    return Object.keys(contact).reduce((acc, key = '') => {
        acc[key.toLowerCase()] = contact[key];
        return acc;
    }, {});
};

/**
 * Parse CSV contact to extract properties and generate a vCard
 * @param {Object<csv>} contact
 * @param {Object<vCard>}
 */
const toVCard = (contact = {}) => {
    const c = formatContact(contact);
    return _.reduce(
        properties,
        (acc, key = '') => {
            const props = keys[key](c);

            if (props.length) {
                _.each(props, ({ value = '', parameter = '' }) => {
                    const params = {};

                    if (parameter) {
                        params.type = parameter;
                    }

                    acc.add(key, value, params);
                });
            }

            return acc;
        },
        new vCard()
    );
};

/**
 * Convert CSV data to vCard
 * @param {File} file
 * @return {Promise<Array>}
 */
export const csvToVCard = (file) => {
    return new Promise((resolve, reject) => {
        const onComplete = ({ data = [] } = {}) => resolve(data.map(toVCard));
        Papa.parse(file, {
            header: true, // If true, the first row of parsed data will be interpreted as field names. An array of field names will be returned in meta, and each row of data will be an object of values keyed by field name instead of a simple array. Rows with a different number of fields from the header row will produce an error.
            dynamicTyping: false, // If true, numeric and boolean data will be converted to their type instead of remaining strings.
            complete: onComplete,
            error: reject,
            skipEmptyLines: true // If true, lines that are completely empty will be skipped. An empty line is defined to be one which evaluates to empty string.
        });
    });
};
