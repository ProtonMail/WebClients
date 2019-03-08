import _ from 'lodash';
import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64 } from 'pmcrypto';
import getRandomValues from 'get-random-values';

import { MAILBOX_PASSWORD_KEY, OAUTH_KEY } from '../../constants';

/* @ngInject */
function secureSessionStorage() {
    // Partially inspired by http://www.thomasfrank.se/sessionvars.html

    // This service implements essentially the sessionStorage API. However,
    // we aim to deliberately be non-persistent. This is useful for data that
    // wants to be preserved across refreshes, but is too sensitive to be
    // safely written to disk. Unfortunately, although sessionStorage is
    // deleted when a session ends, major browsers automatically write it
    // to disk to enable a session recovery feature, so using sessionStorage
    // alone is inappropriate.

    // To achieve this, we do two tricks. The first trick is to delay writing
    // any possibly persistent data until the user is actually leaving the
    // page (onunload). This already prevents any persistence in the face of
    // crashes, and severely limits the lifetime of any data in possibly
    // persistent form on refresh.

    // The second, more important trick is to split sensitive data between
    // window.name and sessionStorage. window.name is a property that, like
    // sessionStorage, is preserved across refresh and navigation within the
    // same tab - however, it seems to never be stored persistently. This
    // provides exactly the lifetime we want. Unfortunately, window.name is
    // readable and transferable between domains, so any sensitive data stored
    // in it would leak to random other websites.

    // To avoid this leakage, we split sensitive data into two shares which
    // xor to the sensitive information but which individually are completely
    // random and give away nothing. One share is stored in window.name, while
    // the other share is stored in sessionStorage. This construction provides
    // security that is the best of both worlds - random websites can't read
    // the data since they can't access sessionStorage, while disk inspections
    // can't read the data since they can't access window.name. The lifetime
    // of the data is therefore the smaller lifetime, that of window.name.

    const storage = window.sessionStorage;
    let nameStorage;
    try {
        nameStorage = JSON.parse(window.name);
    } catch (e) {
        nameStorage = {};
    }

    let data = {};

    const whitelist = [
        MAILBOX_PASSWORD_KEY,
        OAUTH_KEY + ':SessionToken',
        OAUTH_KEY + ':UID',
        'proton:decrypted_token',
        'proton:encrypted_password'
    ];

    for (let i = 0; i < whitelist.length; i++) {
        if (!nameStorage.hasOwnProperty(whitelist[i])) {
            continue;
        }

        let item = storage.getItem(whitelist[i]);
        let nameItem = nameStorage[whitelist[i]];

        if (!angular.isString(item) || !angular.isString(nameItem)) {
            continue;
        }

        try {
            item = binaryStringToArray(decodeBase64(item));
            nameItem = binaryStringToArray(decodeBase64(nameItem));
        } catch (e) {
            continue;
        }

        if (item.length !== nameItem.length) {
            continue;
        }

        const xored = new Array(item.length);

        for (let j = 0; j < item.length; j++) {
            xored[j] = item[j] ^ nameItem[j];
        }

        // Strip off padding
        let unpaddedLength = item.length;

        while (unpaddedLength > 0 && xored[unpaddedLength - 1] === 0) {
            unpaddedLength--;
        }

        data[whitelist[i]] = arrayToBinaryString(xored.slice(0, unpaddedLength));
    }

    storage.clear();
    window.name = '';
    nameStorage = {};

    const api = {
        getItem(key) {
            if (angular.isString(key) && data.hasOwnProperty(key)) {
                return data[key];
            } else {
                return null;
            }
        },

        setItem(key, value) {
            if (angular.isString(key) && angular.isString(value)) {
                data[key] = value;
            }
        },

        removeItem(key) {
            if (angular.isString(key) && data.hasOwnProperty(key)) {
                delete data[key];
            }
        },

        clear() {
            data = {};
        }
    };

    var flush = function() {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                const item = binaryStringToArray(data[key]);
                const paddedLength = Math.ceil(item.length / 256) * 256;

                var share1 = getRandomValues(new Uint8Array(paddedLength));
                var share2 = new Uint8Array(share1);

                for (let i = 0; i < item.length; i++) {
                    share2[i] ^= item[i];
                }

                nameStorage[key] = encodeBase64(arrayToBinaryString(share1));
                storage.setItem(key, encodeBase64(arrayToBinaryString(share2)));
            }
        }

        if (!_.isEmpty(nameStorage)) {
            window.name = JSON.stringify(nameStorage);
        }
    };

    if (window.addEventListener) {
        window.addEventListener('unload', flush, false);
    } else if (window.attachEvent) {
        window.attachEvent('onunload', flush);
    } else {
        throw new Error('No method for adding event listeners!');
    }

    return api;
}
export default secureSessionStorage;
