import { binaryStringToArray, decodeBase64, getKeys } from 'pmcrypto';

import { readFileAsString, readDataUrl } from '../../../helpers/fileHelper';
import { describe } from '../../../helpers/keyAlgorithm';
import { KEY_FLAGS } from '../../constants';

/* @ngInject */
function contactKeyManager(notification, contactKey, networkActivityTracker, gettextCatalog, downloadFile, keyCache) {
    const I18N = {
        sendKeyDetails(created, bits) {
            return gettextCatalog.getString(
                'Created on {{created}}, {{bits}} bits (can be used for sending and signature verification)',
                { created, bits },
                'Key details'
            );
        },
        verificationKeyDetails(created, bits) {
            return gettextCatalog.getString(
                'Created on {{created}}, {{bits}} bits (cannot be used for sending)',
                { created, bits },
                'Key details'
            );
        },
        revokedKeyNotification(fingerprint) {
            return gettextCatalog.getString(
                'The public key with fingerprint {{ fingerprint }} was replaced with a revoked key.',
                { fingerprint },
                'Notification update'
            );
        },
        updatedKeyNotification(fingerprint) {
            return gettextCatalog.getString(
                'The public key with fingerprint {{ fingerprint }} updated.',
                { fingerprint },
                'Notification update'
            );
        }
    };

    return (scope, { keys = [], isInternal = false, email = '', onChange: triggerChange = () => {} }) => {
        /**
         * Calculates properties for all BE keys. Are used in the template to determine whether to show certain rows.
         */
        const updateBEKeys = () => {
            scope.BE.items.forEach((item) => {
                item.hide = scope.UI.items.some(({ fingerprint }) => fingerprint === item.fingerprint);
            });
            scope.BE.hasUntrusted = scope.BE.items.some(({ hide }) => !hide);
        };

        /**
         * Calculates the new properties for the trusted keys, BE keys, and triggers the passed in change callbacks
         * @return {void}
         */
        const onChange = () =>
            scope.$applyAsync(() => {
                if (isInternal) {
                    scope.UI.items.forEach((item) => {
                        item.verificationOnly = !scope.BE.items.some(
                            (bItem) => item.fingerprint === bItem.fingerprint && !bItem.verificationOnly
                        );
                        item.customKey = !scope.BE.items.some((bItem) => item.fingerprint === bItem.fingerprint);
                    });
                }
                const fingerprints = [];
                const { head, tail } = scope.UI.items.reduce(
                    (acc, item) => {
                        if (fingerprints.includes(item.fingerprint)) {
                            return acc;
                        }
                        fingerprints.push(item.fingerprint);
                        if (item.verificationOnly || item.isExpired) {
                            acc.tail.push(item);
                        } else {
                            acc.head.push(item);
                        }
                        return acc;
                    },
                    { head: [], tail: [] }
                );
                scope.UI.items = head.concat(tail);
                updateBEKeys();
                triggerChange();
            });

        /**
         * Describe the given key its details in a string
         * @param {Object} keyInfo
         * @return {String}
         */
        const getDetails = (keyInfo) => {
            const created = keyInfo.created.toLocaleDateString();
            const bits = keyInfo.bitSize;
            if (!keyInfo.verificationOnly) {
                return I18N.sendKeyDetails(created, bits);
            }
            return I18N.verificationKeyDetails(created, bits);
        };

        /**
         * Set the public key data in the index'th element of our contact UI object
         * @param {Object} keyInfo
         * @return {Object} key item
         */
        const getPublickeyInfo = (keyInfo) => ({
            info: keyInfo,
            value: keyInfo.key,
            fingerprint: keyInfo.fingerprint,
            algType: describe(keyInfo),
            created: keyInfo.created.toLocaleDateString(),
            expires: keyInfo.expires != null && isFinite(keyInfo.expires) ? keyInfo.expires.toLocaleDateString() : '-',
            isExpired: keyInfo.isExpired,
            details: getDetails(keyInfo),
            invalidMessage: keyInfo.invalidMessage
        });

        /**
         * Moves a key from the BE keys to the trusted keys
         * @param {Object} item
         */
        const moveToTrusted = (item) => {
            scope.$applyAsync(() => {
                scope.UI.items.push(getPublickeyInfo(item.info));
                onChange();
            });
        };

        /**
         * Moves all keys from the BE to the trusted keys.
         */
        const moveAllToTrusted = () => {
            scope.$applyAsync(() => {
                const untrustedKeys = scope.BE.items.filter(({ hide }) => !hide);
                untrustedKeys.forEach((item) => {
                    scope.UI.items.push(getPublickeyInfo(item.info));
                });
                onChange();
            });
        };

        /**
         * Remove all keys from the trusted keys
         */
        const removeAll = () => {
            scope.$applyAsync(() => {
                scope.UI.items = [];
                onChange();
            });
        };

        /**
         * Select a certain key at index with data item as your new primary key
         * @param {Object} item the key that you want to select as new primary key
         * @param {Integer} index the old index of key `item`.
         */
        const makePrimary = (item, index) => {
            scope.$applyAsync(() => {
                scope.UI.items.splice(index, 1);
                scope.UI.items.unshift(item);
                onChange();
            });
        };

        /**
         * Remove key `item` from the lists of keys
         * @param {Object} item a contact key
         * @param {Integer} index
         */
        const remove = (item, index) => {
            scope.$applyAsync(() => {
                scope.UI.items.splice(index, 1);
                onChange();
            });
        };

        /**
         * Triggers a download of key `item`
         * @param {Object} item a contact key
         */
        const download = async (item) => {
            const [, base64] = item.value.split(',');
            const data = binaryStringToArray(decodeBase64(base64));
            const [key] = await getKeys(data);
            const blob = new Blob([key.armor()], { type: 'data:text/plain;charset=utf-8;' });
            const filename = `publickey - ${email} - 0x${item.fingerprint.slice(0, 8).toUpperCase()}.asc`;

            downloadFile(blob, filename);
        };

        /**
         * Read the files given and return a key information object, or an object describing with the file name if
         * the file is not a valid key.
         * @param {Array} files an array of File objects
         * @return {Promise<Array>} Returns an array promise filled with keyInfo objects
         */
        const getInfos = (files) => {
            return Promise.all(
                files.map((file) => {
                    return readFileAsString(file)
                        .then((key) => contactKey.keyInfo(key, email))
                        .catch(() => ({ error: file.name }));
                })
            );
        };
        /**
         * Updates the keys trusted by updating the knownKeys. Adds the newKeys to the trusted keys list
         * @param {Array} knownKeys The key information for the keys that are already trusted but should be updated
         * @param {Array} newKeys The key information for the keys that were not trusted yet
         */
        const updateKeys = (knownKeys, newKeys) => {
            scope.$applyAsync(() => {
                // Add keys as new keys to the trusted keys (= pinned keys)
                newKeys.forEach((keyInfo) => {
                    scope.UI.items.push(getPublickeyInfo(keyInfo));
                });

                // Overwrite known trusted keys by the newly passed in data
                knownKeys.forEach((key) => {
                    const index = scope.UI.items.findIndex(({ fingerprint }) => key.fingerprint === fingerprint);

                    if (index < 0) {
                        return;
                    }

                    if (!scope.UI.items[index].isExpired && key.revocationSignatures.length) {
                        notification.info(I18N.revokedKeyNotification(key.fingerprint.substring(0, 10)));
                    } else {
                        notification.info(I18N.updatedKeyNotification(key.fingerprint.substring(0, 10)));
                    }

                    scope.UI.items[index] = getPublickeyInfo(key);
                });
                onChange();
            });
        };

        /**
         * Add the list of keys (each element in the list should be an object generated by getInfos) to
         * trusted keys. Automatically updates the old key if the key was already trusted.
         * @param {Array} keys
         */
        const addKeys = (keys) => {
            const fingerprints = scope.UI.items.map(({ fingerprint }) => fingerprint);
            const { knownKeys, newKeys } = keys.reduce(
                (acc, key) => {
                    if (fingerprints.includes(key.fingerprint)) {
                        acc.knownKeys.push(key);
                    } else {
                        acc.newKeys.push(key);
                    }
                    fingerprints.push(key.fingerprint);
                    return acc;
                },
                { knownKeys: [], newKeys: [] }
            );

            if (knownKeys.length === 0 && newKeys.length === 0) {
                return;
            }

            updateKeys(knownKeys, newKeys);
        };

        const calculateBE = () =>
            keyCache
                .get([scope.email])
                .then(({ [scope.email]: { Keys } }) =>
                    Promise.all(
                        Keys.map(({ PublicKey, Flags }) =>
                            contactKey.keyInfo(PublicKey, email).then((info) => ({
                                ...info,
                                verificationOnly: !(Flags & KEY_FLAGS.ENABLE_ENCRYPTION)
                            }))
                        )
                    )
                )
                .then((infos) =>
                    infos.map((info) => ({
                        value: info.key,
                        fingerprint: info.fingerprint,
                        algType: describe(info),
                        details: getDetails(info),
                        bits: info.bitSize,
                        created: info.created.toLocaleDateString(),
                        hide: false,
                        verificationOnly: info.verificationOnly,
                        info
                    }))
                );

        const setUI = () => {
            const promises = keys.reduce((acc, value) => {
                if (!value) {
                    return acc;
                }
                const key = readDataUrl(value);
                const promise = contactKey.keyInfo(key, email).then(getPublickeyInfo);
                acc.push(promise);
                return acc;
            }, []);

            return Promise.all(promises);
        };
        /**
         * Initializes scope.UI and scope.BE
         */
        const init = async () => {
            const list = Promise.all([setUI(), calculateBE()]);
            const promises = networkActivityTracker.track(list);
            const [uiItems, beItems] = await promises;

            scope.UI = { items: uiItems };
            scope.BE = { hide: true, items: beItems, hasUntrusted: false };

            onChange();
        };

        init();

        return {
            getInfos,
            addKeys,
            download,
            removeAll,
            moveToTrusted,
            moveAllToTrusted,
            makePrimary,
            remove
        };
    };
}

export default contactKeyManager;
