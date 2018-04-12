import _ from 'lodash';

import { RECIPIENT_TYPE } from '../../constants';
import keyAlgorithm from '../../keys/helper/keyAlgorithm';
import { readFile } from '../../../helpers/fileHelper';
import { removeEmailAlias } from '../../../helpers/string';

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
    networkActivityTracker
) {
    const AS_SORTABLE_DISABLED = 'as-sortable-disabled';

    const I18N = {
        invalidKeys(key) {
            return gettextCatalog.getString('{{key}} is not a valid PGP key.', { key }, 'Error');
        },
        LANG_AND: gettextCatalog.getString('and', null, 'String separator'),
        KEY_REVOKED: gettextCatalog.getString('This key is revoked.', null, 'Info'),
        KEY_EXPIRED: gettextCatalog.getString('This key is expired.', null, 'Info'),
        fingerprintReplaced(key) {
            return gettextCatalog.getString(
                'The public key with fingerprint {{key}} was replaced with a revoked key.',
                {
                    key: key.fingerprint.substring(0, 10)
                },
                'Info'
            );
        },
        fingerprintUpdated(key) {
            return gettextCatalog.getString(
                'The public key with fingerprint {{key}} updated.',
                {
                    key: key.fingerprint.substring(0, 10)
                },
                'Info'
            );
        },
        userMismatch(keyemails, emails) {
            return gettextCatalog.getPlural(
                keyemails.length,
                'User IDs mismatch. This key is assigned to {{emails}}.',
                'User IDs mismatch. The emails {{emails}} are assigned to this key.',
                { emails },
                'Warning'
            );
        }
    };

    const toggle = (elem, className, value) => {
        return elem.classList.contains(className) === value || elem.classList.toggle(className);
    };

    const listToString = (list = [], separator = I18N.LANG_AND) => {
        return list.slice(0, -2).join(', ') + list.slice(list.length - 2, list.length).join(` ${separator} `);
    };

    const moveToBottom = (list, key) => {
        const { start, end } = list.reduce(
            (acc, item) => {
                const type = !item[key] ? 'start' : 'end';
                acc[type].push(item);
                return acc;
            },
            { start: [], end: [] }
        );
        return start.concat(end);
    };

    const invalidUserId = ([{ users }], scope) => {
        // we don't normalize anything here because enigmail / pgp also doesn't normalize it.
        const userids = _.map(users, ({ userId }) => userId.userid);
        const keyemails = _.map(userids, (userid) => {
            const [, match = userid] = /<([^>]*)>/.exec(userid) || [];
            return match;
        });

        if (_.intersection(_.map(keyemails, removeEmailAlias), [removeEmailAlias(scope.email)]).length) {
            return false;
        }
        return I18N.userMismatch(keyemails, listToString(keyemails));
    };

    const expiredKey = (keyInfo) => {
        if (!keyInfo.isExpired) {
            return false;
        }
        if (keyInfo.revocationSignatures.length) {
            return I18N.KEY_REVOKED;
        }
        return I18N.KEY_EXPIRED;
    };

    const invalidMessage = (keyInfo, value, scope) => {
        const keys = pmcw.getKeys(value);
        const messages = [expiredKey(keyInfo), invalidUserId(keys, scope)].filter(Boolean);
        return messages.length && messages.join(' ');
    };

    const getInfo = (scope) => async (key) => {
        const [result, isExpired] = await Promise.all([pmcw.keyInfo(key), pmcw.isExpiredKey(pmcw.getKeys(key)[0])]);

        const data = typeof key === 'string' ? pmcw.stripArmor(key) : key;
        result.key = 'data:application/pgp-keys;base64,' + pmcw.encode_base64(pmcw.arrayToBinaryString(data));
        result.isExpired = isExpired;
        result.invalidMessage = invalidMessage(result, key, scope);
        return result;
    };

    const getFileKeys = (scope) => (file) => {
        return readFile(file)
            .then(getInfo(scope))
            .catch(() => ({ error: file.name }));
    };

    const getValidKeys = async (fileList, scope) => {
        const keys = await Promise.all(_.map(fileList, getFileKeys(scope)));

        const { invalid, valid } = keys.reduce(
            (acc, key) => {
                const type = key.error ? 'invalid' : 'valid';
                acc[type].push(key);
                return key;
            },
            { invalid: [], valid: [] }
        );

        if (invalid.length) {
            notification.error(I18N.invalidKeys(listToString(invalid)));
        }

        return valid;
    };

    const getKeyStatus = (keys = [], items = []) => {
        const MAP_FINGERPRINT = items.reduce((acc, item, index) => {
            acc[item.fingerprint] = { item, index };
            return acc;
        }, {});

        const config = keys.reduce(
            (acc, key) => {
                const type = MAP_FINGERPRINT[key.fingerprint] ? 'knows' : 'new';
                acc[type].push(key);
                return key;
            },
            { knows: [], news: [] }
        );

        return { ...config, MAP_FINGERPRINT };
    };

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
            const isInternal = scope.internalKeys.RecipientType === RECIPIENT_TYPE.TYPE_INTERNAL;

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
                        scope.UI.items = moveToBottom(scope.UI.items, 'verificationOnly');
                    } else {
                        // make sure the verification keys are at the bottom.
                        scope.UI.items = moveToBottom(scope.UI.items, 'isExpired');
                    }
                    scope.model[type] = scope.UI.items;
                    scope.keyPinningEnabled =
                        scope.UI.items.length > 1 || (scope.UI.items.length === 1 && scope.UI.items[0].value !== '');
                    dispatcher['contact.item']('change', { items: scope.UI.items, type: scope.type });
                    updateBEKeys();
                    toggle(element[0], 'all-keys-trusted', !scope.BE.hasUntrusted && scope.BE.items.length > 0);
                });
            scope.visibleItems = () => scope.UI.items.filter(({ hide }) => !hide);

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
                    Promise.all(
                        Keys.map(({ PublicKey, Send }) =>
                            getInfo(PublicKey).then((info) => _.extend(info, { verificationOnly: !Send }))
                        )
                    )
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

            const refresh = ({ keys = [], newKeys = [], MAP }, target) => {
                scope.$applyAsync(() => {
                    keys.forEach((key) => {
                        const { index } = MAP[key.fingerprint];
                        const isReplace = !scope.UI.items[index].isExpired && key.revocationSignatures.length;
                        const action = isReplace ? 'fingerprintReplaced' : 'fingerprintUpdated';
                        notification.info(I18N[action](key));
                        setPublicKey(index, key);
                    });

                    if (newKeys.length && scope.UI.items.length === 1 && scope.UI.items[0].value === '') {
                        setPublicKey(0, newKeys[0]);
                        newKeys.splice(0, 1);
                    }

                    newKeys.forEach(newKeys, (keyInfo) => {
                        addNewField();
                        setPublicKey(scope.UI.items.length - 1, keyInfo);
                    });
                    scope.change();
                    target.value = '';
                });
            };

            const onChange = async ({ target }) => {
                if (!$(target).is('input[type=file]') || !target.files || target.files.length === 0) {
                    return;
                }

                try {
                    const keys = await getValidKeys(target.files, scope);
                    const config = getKeyStatus(keys, scope.UI.items);

                    if (!config.knows.length && !config.news.length) {
                        return (target.value = '');
                    }

                    refresh(config, target);
                } catch (e) {
                    target.value = '';
                }
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
