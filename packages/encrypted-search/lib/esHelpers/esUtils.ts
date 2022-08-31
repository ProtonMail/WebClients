import { removeItem } from '@proton/shared/lib/helpers/storage';

import { DIACRITICS_REGEXP } from '../constants';
import { GetItemInfo } from '../models';

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
export const isTimepointSmaller = (t1: [number, number], t2: [number, number]) =>
    t1[0] < t2[0] || (t1[0] === t2[0] && t1[1] < t2[1]);
