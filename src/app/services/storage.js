angular.module("proton.storage", ["proton.webcrypto"])

.factory("secureSessionStorage", function(CONSTANTS, webcrypto) {
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

    var storage = window.sessionStorage;
    var nameStorage;
    try {
        nameStorage = JSON.parse(window.name);
    } catch (e) {
        nameStorage = {};
    }

    var data = {};

    var whitelist = [
        CONSTANTS.MAILBOX_PASSWORD_KEY,
        CONSTANTS.OAUTH_KEY + ':SessionToken',
        CONSTANTS.OAUTH_KEY + ':Uid',
        CONSTANTS.OAUTH_KEY + ':AccessToken',
        CONSTANTS.OAUTH_KEY + ':RefreshToken',
        'proton:decrypted_token',
        'proton:encrypted_password'
    ];

    for (var i = 0; i < whitelist.length; i++) {
        if (!nameStorage.hasOwnProperty(whitelist[i])) {
            continue;
        }

        var item = storage.getItem(whitelist[i]);
        var nameItem = nameStorage[whitelist[i]];

        if (!angular.isString(item) || !angular.isString(nameItem)) {
            continue;
        }

        try {
            item = pmcrypto.binaryStringToArray(pmcrypto.decode_base64(item));
            nameItem = pmcrypto.binaryStringToArray(pmcrypto.decode_base64(nameItem));
        } catch (e) {
            continue;
        }

        if (item.length !== nameItem.length) {
            continue;
        }

        var xored = new Array(item.length);

        for (var j = 0; j < item.length; j++) {
            xored[j] = item[j] ^ nameItem[j];
        }

        // Strip off padding
        var unpaddedLength = item.length;

        while (unpaddedLength > 0 && xored[unpaddedLength - 1] === 0) {
            unpaddedLength--;
        }

        data[whitelist[i]] = pmcrypto.arrayToBinaryString(xored.slice(0, unpaddedLength));
    }

    storage.clear();
    window.name = "";
    nameStorage = {};

    var api = {
        getItem: function(key) {
            if (angular.isString(key) && data.hasOwnProperty(key)) {
                return data[key];
            } else {
                return null;
            }
        },

        setItem: function(key, value) {
            if (angular.isString(key) && angular.isString(value)) {
                data[key] = value;
            }
        },

        removeItem: function(key) {
            if (angular.isString(key) && data.hasOwnProperty(key)) {
                delete data[key];
            }
        },

        clear: function() {
            data = {};
        }
    };

    var flush = function() {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var item = pmcrypto.binaryStringToArray(data[key]);
                var paddedLength = Math.ceil(item.length/256)*256;

                var share1 = webcrypto.getRandomValues(new Uint8Array(paddedLength));
                var share2 = new Uint8Array(share1);

                for (var i = 0; i < item.length; i++) {
                    share2[i] ^= item[i];
                }

                nameStorage[key] = pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(share1));
                storage.setItem(key, pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(share2)));
            }
        }

        if (!_.isEmpty(nameStorage)) {
            window.name = JSON.stringify(nameStorage);
        }
    };

    if (window.addEventListener) {
        window.addEventListener("unload", flush, false);
    } else if (window.attachEvent) {
        window.attachEvent("onunload", flush);
    } else {
        throw new Exception("No method for adding event listeners!");
    }

    return api;
});
