import _ from 'lodash';
import keyAlgorithm from '../../keys/helper/keyAlgorithm';

/* @ngInject */
function contactPublicKeys(
    confirmModal,
    contactUI,
    readDataUrl,
    pmcw,
    downloadFile,
    gettextCatalog,
    notification,
    dispatchers,
    keyCache,
    networkActivityTracker,
    CONSTANTS
) {
    const AS_SORTABLE_DISABLED = 'as-sortable-disabled';

    const INVALID_KEY = gettextCatalog.getString('%s is not a valid PGP key.', null, 'Error message');
    const LANG_AND = gettextCatalog.getString('and', null, 'String separator');
    const toggle = (elem, className, value) => elem.classList.contains(className) === value || elem.classList.toggle(className);

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/directives/contact/contactPublicKeys.tpl.html'),
        require: '^form',
        scope: {
            form: '=',
            model: '=',
            state: '=',
            email: '@',
            getDatas: '&datas',
            type: '@type',
            internalKeys: '='
        },
        link(scope, element, attr, ngFormController) {
            const { dispatcher } = dispatchers(['composer.new', 'contact.item']);
            const datas = scope.getDatas();
            const type = scope.type;
            const state = scope.state;
            const list = element.find('.contactItem-container');
            const isInternal = scope.internalKeys.RecipientType === CONSTANTS.RECIPIENT_TYPE.TYPE_INTERNAL;

            list.addClass(`contactItem-container-${scope.type}`);
            list.addClass(AS_SORTABLE_DISABLED);

            const ACTIONS = {
                add,
                upload,
                download,
                remove,
                makePrimary,
                removeAll
            };

            const BE_ACTIONS = {
                addVirtual,
                addAllUntrustedKeys,
                downloadUntrusted: download,
                toggleKeyPinning
            };

            function onClick({ target }) {
                const action = target.getAttribute('data-action');
                const index = parseInt(target.getAttribute('data-index'), 10);
                if (_.has(ACTIONS, action)) {
                    ACTIONS[action](target, scope.UI.items[index], index);
                }
                if (_.has(BE_ACTIONS, action)) {
                    BE_ACTIONS[action](target, scope.BE.items[index], index);
                }
            }

            function upload(target) {
                $(target)
                    .parent()
                    .find('.upload-helper')
                    .click();
                $(target).blur();
            }

            function removeAll() {
                scope.$applyAsync(() => {
                    scope.UI.items = [];
                    scope.change();
                });
            }

            function makePrimary(target, item, index) {
                scope.$applyAsync(() => {
                    scope.UI.items.splice(index, 1);
                    scope.UI.items.unshift(item);
                });
            }

            function download(target, item) {
                const [, base64] = item.value.split(',');
                const data = pmcw.binaryStringToArray(pmcw.decode_base64(base64));
                const [key] = pmcw.getKeys(data);
                const blob = new Blob([key.armor()], { type: 'data:text/plain;charset=utf-8;' });
                const filename = `publickey - ${scope.email} - 0x${item.fingerprint.slice(0, 8).toUpperCase()}.asc`;

                downloadFile(blob, filename);
            }

            function toggleKeyPinning() {
                if (scope.keyPinningEnabled) {
                    removeAll();
                    return;
                }
                addAllUntrustedKeys();
            }

            function add() {
                element.find('.upload-helper').click();
                $('.tooltip').tooltip('hide');
            }
            function addNewField() {
                if (scope.UI.items.length === 1 && !scope.UI.items[0].value) {
                    return;
                }
                const populated = contactUI.populate(scope.UI, type);
                ngFormController.$setDirty();
                contactUI.add(scope.UI, populated.key, populated.type, '');
            }

            function remove(target, item) {
                // Hide all the tooltip
                $('.tooltip')
                    .not(this)
                    .hide();

                item.value = '';
                delete item.invalidMessage;
                delete item.fingerprint;

                if (scope.UI.items.length > 1) {
                    contactUI.remove(scope.UI, item);
                }

                ngFormController.$setDirty();
                scope.change();
                $('.tooltip').tooltip('hide');
            }

            // Drag and Drop configuration
            scope.itemContactDragControlListeners = {
                containment: '.contactDetails-container',
                containerPositioning: 'relative',
                accept(sourceItemHandleScope, destSortableScope) {
                    return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
                },
                dragStart() {
                    scope.itemMoved = true;
                },
                dragEnd() {
                    scope.itemMoved = false;
                },
                orderChanged() {
                    ngFormController.$setDirty();
                }
            };

            scope.UI = contactUI.initialize(datas, type, state);
            scope.change = () =>
                scope.$applyAsync(() => {
                    if (isInternal) {
                        _.each(scope.UI.items, (item) => {
                            item.verificationOnly = !scope.BE.items.some(
                                (bItem) => item.fingerprint === bItem.fingerprint && !bItem.verificationOnly
                            );
                            item.customKey = !scope.BE.items.some((bItem) => item.fingerprint === bItem.fingerprint);
                        });
                        // make sure the verification keys are at the bottom.
                        scope.UI.items = scope.UI.items
                            .filter(({ verificationOnly = false }) => !verificationOnly)
                            .concat(scope.UI.items.filter(({ verificationOnly = false }) => verificationOnly));
                    } else {
                        // make sure the verification keys are at the bottom.
                        scope.UI.items = scope.UI.items
                            .filter(({ isExpired = false }) => !isExpired)
                            .concat(scope.UI.items.filter(({ isExpired = false }) => isExpired));
                    }
                    scope.model[type] = scope.UI.items;
                    scope.keyPinningEnabled = scope.UI.items.length > 1 || (scope.UI.items.length === 1 && scope.UI.items[0].value !== '');
                    dispatcher['contact.item']('change', { items: scope.UI.items, type: scope.type });
                    updateBEKeys();
                    toggle(element[0], 'all-keys-trusted', !scope.BE.hasUntrusted && scope.BE.items.length > 0);
                });
            scope.visibleItems = () => scope.UI.items.filter(({ hide }) => !hide);

            const readFile = async (file) => {
                const reader = new FileReader();
                return new Promise((resolve, reject) => {
                    reader.addEventListener('load', () => resolve(reader.result), false);
                    reader.addEventListener('error', () => reject(reader), false);

                    reader.readAsBinaryString(file);
                });
            };

            const listToString = (separator, list) => list.slice(0, -2).join(', ') + list.slice(list.length - 2, list.length).join(` ${separator} `);

            const expiredKey = (keyInfo) => {
                if (!keyInfo.isExpired) {
                    return false;
                }
                if (keyInfo.revocationSignatures.length) {
                    return gettextCatalog.getString('This key is revoked.');
                }
                return gettextCatalog.getString('This key is expired.');
            };

            const invalidUserId = ([{ users }]) => {
                const normalize = (email) =>
                    email
                        .toLowerCase()
                        .replace(/\+[^@]*@/, '')
                        .replace(/[._-](?=[^@]*@)/g, '');
                // we don't normalize anything here because enigmail / pgp also doesn't normalize it.
                const userids = _.map(users, ({ userId }) => userId.userid);
                const keyemails = _.map(userids, (userid) => {
                    const match = /<([^>]*)>/.exec(userid);
                    return match ? match[1] : userid;
                });

                if (_.intersection(_.map(keyemails, normalize), [normalize(scope.email)]).length) {
                    return false;
                }

                const assigned = listToString(LANG_AND, keyemails);
                const template = gettextCatalog.getPlural(
                    keyemails.length,
                    'User IDs mismatch. This key is assigned to %1.',
                    'User IDs mismatch. The emails %1 are assigned to this key.'
                );
                return template.replace('%1', assigned);
            };

            const invalidMessage = (keyInfo, value) => {
                const keys = pmcw.getKeys(value);
                const messages = _.filter([expiredKey(keyInfo), invalidUserId(keys)]);
                if (messages.length === 0) {
                    return false;
                }
                return messages.join(' ');
            };

            const getInfo = (key) =>
                Promise.all([ pmcw.keyInfo(key), pmcw.isExpiredKey(pmcw.getKeys(key)[0]) ]).then(([ result, isExpired ]) => {
                    const data = typeof key === 'string' ? pmcw.stripArmor(key) : key;
                    result.key = 'data:application/pgp-keys;base64,' + pmcw.encode_base64(pmcw.arrayToBinaryString(data));
                    result.isExpired = isExpired;
                    result.invalidMessage = invalidMessage(result, key);

                    return result;
                });

            const getDetails = (index, keyInfo) => {
                const created = keyInfo.created.toLocaleDateString();
                const bits = keyInfo.bitSize;
                if (!keyInfo.verificationOnly) {
                    return gettextCatalog.getString(
                        'Created on {{created}}, {{bits}} bits (can be used for sending and signature verification)',
                        { created, bits },
                        'Key details'
                    );
                }
                return gettextCatalog.getString(
                    'Created on {{created}}, {{bits}} bits (only used for signature verification)',
                    { created, bits },
                    'Key details'
                );
            };

            const setPublicKey = (index, keyInfo) => {
                scope.UI.items[index].value = keyInfo.key;
                scope.UI.items[index].fingerprint = keyInfo.fingerprint;
                scope.UI.items[index].algType = keyAlgorithm.describe(keyInfo);
                scope.UI.items[index].created = keyInfo.created.toLocaleDateString();
                scope.UI.items[index].expires = isFinite(keyInfo.expires) ? keyInfo.expires.toLocaleDateString() : '-';
                scope.UI.items[index].isExpired = keyInfo.isExpired;
                scope.UI.items[index].details = getDetails(index, keyInfo);
                scope.UI.items[index].invalidMessage = keyInfo.invalidMessage;
            };

            _.each(
                scope.UI.items,
                ({ value }, index) =>
                    value &&
                    readDataUrl(value)
                        .then(getInfo)
                        .then((keyInfo) => setPublicKey(index, keyInfo))
                        .then(scope.change)
            );

            function addVirtual(target, item) {
                scope.$applyAsync(() => {
                    addNewField();
                    setPublicKey(scope.UI.items.length - 1, item.info);
                    scope.change();
                    $('.tooltip').tooltip('hide');
                });
            }

            function addAllUntrustedKeys() {
                scope.$applyAsync(() => {
                    const untrustedKeys = _.filter(scope.BE.items, ({ hide }) => !hide);
                    _.each(untrustedKeys, (item) => {
                        addNewField();
                        setPublicKey(scope.UI.items.length - 1, item.info);
                    });
                    scope.change();
                });
            }

            scope.BE = { hide: true, items: [], hasUntrusted: false };

            const promise = keyCache
                .get([scope.email])
                .then(({ [scope.email]: { Keys } }) =>
                    Promise.all(Keys.map(({ PublicKey, Send }) => getInfo(PublicKey).then((info) => _.extend(info, { verificationOnly: !Send }))))
                )
                .then((infos) =>
                    infos.map((info, index) => ({
                        value: info.key,
                        fingerprint: info.fingerprint,
                        algType: keyAlgorithm.describe(info),
                        details: getDetails(index, info),
                        bits: info.bitSize,
                        created: info.created.toLocaleDateString(),
                        hide: false,
                        verificationOnly: info.verificationOnly,
                        info
                    }))
                )
                .then((items) =>
                    scope.$applyAsync(() => {
                        scope.BE.items = items;
                        updateBEKeys();
                    })
                );

            networkActivityTracker.track(promise);

            function updateBEKeys() {
                scope.BE.items.forEach((item) => {
                    item.hide = _.some(scope.UI.items, ({ fingerprint }) => fingerprint === item.fingerprint);
                });
                scope.BE.hasUntrusted = _.some(scope.BE.items, ({ hide }) => !hide);
            }

            const onChange = ({ target }) => {
                if (!$(target).is('input[type=file]') || !target.files || target.files.length === 0) {
                    return;
                }

                Promise.all(
                    _.map(target.files, (file) =>
                        readFile(file)
                            .then(getInfo)
                            .catch(() => {
                                return { error: file.name };
                            })
                    )
                ).then((keys) => {
                    const invalidKeys = _.filter(_.map(keys, 'error'));
                    if (invalidKeys.length) {
                        notification.error(INVALID_KEY.replace('%s', listToString(LANG_AND, invalidKeys)));
                    }
                    return _.filter(keys, ({ error = false }) => !error);
                }).then((keys) => {
                    const knownKeys = keys.filter(({ fingerprint }) => scope.UI.items.map(({ fingerprint }) => fingerprint).includes(fingerprint));
                    const newKeys = keys.filter(({ fingerprint }) => !scope.UI.items.map(({ fingerprint }) => fingerprint).includes(fingerprint));
                    return [ knownKeys, newKeys ];
                }).then(([ knownKeys, newKeys ]) => {
                    if (knownKeys.length === 0 && newKeys.length === 0) {
                        target.value = '';
                        return;
                    }
                    scope.$applyAsync(() => {
                        knownKeys.forEach((key) => {
                            const index = scope.UI.items.findIndex(({ fingerprint }) => key.fingerprint === fingerprint);
                            if (index < 0) {
                                return;
                            }
                            if (!scope.UI.items[index].isExpired && key.revocationSignatures.length) {
                                notification.info(gettextCatalog.getString('The public key with fingerprint %s was replaced with a revoked key.').replace('%s', key.fingerprint.substring(0, 10)));
                            } else {
                                notification.info(gettextCatalog.getString('The public key with fingerprint %s updated.').replace('%s', key.fingerprint.substring(0, 10)));
                            }
                            setPublicKey(index, key);
                        });
                        if (newKeys.length && scope.UI.items.length === 1 && scope.UI.items[0].value === '') {
                            setPublicKey(0, newKeys[0]);
                            newKeys.splice(0, 1);
                        }

                        _.each(newKeys, (keyInfo) => {
                            addNewField();
                            setPublicKey(scope.UI.items.length - 1, keyInfo);
                        });
                        scope.change();
                        target.value = '';
                    });
                })
                .catch(() => (target.value = ''));
            };

            scope.change();

            element.on('click', onClick);
            element.on('change', onChange);

            scope.$on('$destroy', () => {
                element.off('click', onClick);
            });
        }
    };
}
export default contactPublicKeys;
