import { type ESCiphertext, type IndexKey, encryptItem } from '@proton/crypto/lib/subtle/ad-hoc/encryptedSearch';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { removeItem } from '@proton/shared/lib/helpers/storage';
import type { AddressEvent } from '@proton/shared/lib/interfaces';

import { APOSTROPHES_REGEXP, DIACRITICS_REGEXP, QUOTES_REGEXP } from '../constants';
import type { ESTimepoint, GetItemInfo } from '../models';

/**
 * Remove all ES blobs in local storage related to a user
 */
export const removeESFlags = (userID: string) => {
    Object.keys(window.localStorage).forEach((key) => {
        const chunks = key.split(':');
        if (chunks[0] === 'ES' && chunks[1] === userID) {
            removeItem(key);
        }
    });
};

/**
 * Remove milliseconds from numeric value of a date
 */
export const roundMilliseconds = (time: number) => Math.floor(time / 1000);

/**
 * Request storage persistence to prevent the ES database from being evicted
 */
export const requestPersistence = async () => {
    if (window.navigator.storage && window.navigator.storage.persist) {
        await window.navigator.storage.persist();
    }
};

/**
 * Remove diacritics and apply other transforms to the NFKD decomposed string
 */
export const normalizeString = (str: string, format: 'NFD' | 'NFKD' = 'NFKD') =>
    str.toLocaleLowerCase().normalize(format).replace(DIACRITICS_REGEXP, '');

/**
 * Find the index of an item in an item array. Should return -1 if the index is not found
 */
export const findItemIndex = <ESItemMetadata>(
    itemID: string,
    itemArray: ESItemMetadata[],
    getItemInfo: GetItemInfo<ESItemMetadata>
) => itemArray.findIndex((item) => getItemInfo(item).ID === itemID);

/**
 * Compare two timestamps and return whether the first one is smaller (i.e. older)
 * than the second one
 */
export const isTimepointSmaller = (t1: ESTimepoint, t2: ESTimepoint) =>
    t1[0] < t2[0] || (t1[0] === t2[0] && t1[1] < t2[1]);

/**
 * Verify that a given value is of type [number, number]
 */
export const isESTimepoint = (value: any): value is ESTimepoint =>
    Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number';

/**
 * Check whether an object contains no properties. This can happen if products
 * return e.g. a content object with undefined properties only
 */
export const isObjectEmpty = (object: Object) => Object.keys(object).length === 0;

/**
 * Size in bytes of a ciphertext
 */
export const ciphertextSize = (ciphertext: ESCiphertext | undefined) =>
    !ciphertext ? 0 : ciphertext.iv.length + ciphertext.ciphertext.byteLength;

/**
 * Size in bytes of a batch of ciphertexts
 */
export const ciphertextBatchSize = (ciphertextBatch: (ESCiphertext | undefined)[]) =>
    ciphertextBatch.reduce((p, c) => p + ciphertextSize(c), 0);

/**
 * Turn unusual quotes into normal ones, that can then be searched to split sentences
 */
export const replaceQuotes = (str: string) => str.replace(QUOTES_REGEXP, `"`);

/**
 * turn unusual apostrophes into normal ones
 */
export const replaceApostrophes = (str: string) => str.replace(APOSTROPHES_REGEXP, `'`);

/**
 * Returns true if one or more keys have been reactivated
 */
export const hasReactivatedKey = ({
    AddressEvents,
    numAddresses,
}: {
    AddressEvents?: AddressEvent[];
    numAddresses: number;
}) => {
    /**
     * `EVENT_ACTIONS.UPDATE` on AddressEvent can have several meaning: address key reactivation, address set as default
     *
     * However, only key reactivation affects all the addresses at once, that's why we check if the number of addresses
     * with this action matches the total nbr of addresses
     *
     * 3 (very) edge cases:
     *  - when we have strictly 2 addresses and change the one set as default, both will have `EVENT_ACTIONS.UPDATE`
     *  - when we reactivate a key for only a single address, this condition won't be matched then.
     *  - if a key gets reactivated during the indexation, this condition will be matched, but the event will be consume and we won't correct undecrypted ones
     */
    return AddressEvents?.filter(({ Action }) => Action === EVENT_ACTIONS.UPDATE).length === numAddresses;
};

/**
 * Create the encrypted object to store in IndexedDB
 */
export const serializeAndEncryptItem = (indexKey: IndexKey, itemToStore: object) => {
    const serializedItem = new TextEncoder().encode(JSON.stringify(itemToStore));
    return encryptItem(indexKey, serializedItem);
};
