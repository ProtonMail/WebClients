import _ from 'lodash';

import { remove } from './arrayHelper';

/**
 * Extract duplicate items.
 * @param {array} items
 * @param {string} duplicateKey
 * @param {string} uniqueKey
 * @param {string} objectKey
 * @returns {{}}
 */
function extractDuplicates({ items = [], duplicateKey = '', uniqueKey = '', objectKey = '' }) {
    const { cache, uniques } = _.reduce(
        items,
        (acc, item) => {
            const key = item[duplicateKey];
            const unique = item[uniqueKey];
            const object = item[objectKey];

            const { cache, uniques } = acc;

            // If this unique value has not been seen, initialize it.
            if (!uniques[unique]) {
                uniques[unique] = { potentialDuplicateKeys: [], used: false, object };
            }

            // If this unique value has already been used as a duplicate, continue.
            if (uniques[unique].used) {
                return acc;
            }

            // Previously unseen duplicate key.
            if (!cache[key]) {
                // Initialize it as a single array with the unique value.
                cache[key] = [unique];
                // Register that this unique value has a potential duplicate in these keys.
                uniques[unique].potentialDuplicateKeys.push(key);
            } else if (cache[key].indexOf(unique) === -1) {
                // Ensure that this unique value does not already exist in the duplicates.
                // A duplicate has been discovered.
                cache[key].push(unique);

                // Register that this unique value has been used.
                uniques[unique].used = true;

                // Ensure that all unique values registered as a duplicate for this key are used only once.
                cache[key].forEach((u) => {
                    // The unique value was used on this duplicate key, so free it up from all other potential duplicate keys.
                    uniques[u].potentialDuplicateKeys.forEach((k) => {
                        if (k !== key) {
                            cache[k] = remove(cache[k], u);
                        }
                    });
                    uniques[u].potentialDuplicateKeys.length = 0;
                });
            }
            return acc;
        },
        { cache: Object.create(null), uniques: Object.create(null) }
    );

    // For each duplicates found, convert the unique values to the desired object.
    return _.reduce(
        Object.keys(cache),
        (acc, key) => {
            if (cache[key].length <= 1) {
                return acc;
            }
            acc[key] = cache[key].map((unique) => uniques[unique].object);
            return acc;
        },
        Object.create(null)
    );
}

export default extractDuplicates;
