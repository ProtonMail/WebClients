import { RECIPIENT_TYPE } from '../../constants';
import { listToString } from '../../../helpers/arrayHelper';
import { toggle } from '../../../helpers/domHelper';

/* @ngInject */
function contactPublicKeys(
    keyCompression,
    contactKey,
    contactKeyManager,
    tooltipModel,
    gettextCatalog,
    notification,
    dispatchers,
    networkActivityTracker
) {
    const AS_SORTABLE_DISABLED = 'as-sortable-disabled';
    const ALL_KEYS_TRUSTED = 'all-keys-trusted';

    const I18N = {
        invalidKeyMessage(keys) {
            return gettextCatalog.getPlural(
                keys.length,
                '{{keys}} is not a valid PGP key.',
                '{{keys}} are not valid PGP keys.',
                { keys: listToString(keys, I18N.LANG_AND) },
                'Error message'
            );
        },
        LANG_AND: gettextCatalog.getString('and', null, 'String separator')
    };

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/directives/contact/contactPublicKeys.tpl.html'),
        require: '^form',
        scope: {
            form: '=',
            model: '=',
            email: '@',
            internalKeys: '='
        },
        link(scope, element, attr, ngFormController) {
            const { dispatcher, on, unsubscribe } = dispatchers(['composer.new', 'advancedSetting']);
            const email = scope.email;
            const keys = scope.model;
            const list = element.find('.contactItem-container');
            const isInternal = scope.internalKeys.RecipientType === RECIPIENT_TYPE.TYPE_INTERNAL;
            // keyManager is responsible for managing the UI and BE objects on the scope.
            const keyManager = contactKeyManager(scope, {
                keys,
                isInternal,
                email,
                onChange() {
                    ngFormController.$setDirty();
                    toggle(element[0], ALL_KEYS_TRUSTED, !scope.BE.hasUntrusted && scope.BE.items.length > 0);
                    dispatcher.advancedSetting('updateKeys', { keys: scope.UI.items.map(({ value }) => value) });
                }
            });

            list.addClass(`contactItem-container-${scope.type}`);
            list.addClass(AS_SORTABLE_DISABLED);

            /**
             * Triggers an upload dialog to upload a new key to your key set
             * @param target
             */
            const add = () => {
                element.find('.upload-helper').click();
                tooltipModel.hideAll();
            };

            /**
             * Remove the passed in key from the trusted keys
             * @param {Object} item
             */
            const remove = (item) => {
                keyManager.remove(item);
                tooltipModel.hideAll();
            };

            /**
             * Enables or disables key trusting (=pinning) depending on the current state. Only useable for internal
             * contacts.
             */
            const toggleKeyPinning = (keyPinningEnabled) => {
                if (keyPinningEnabled) {
                    keyManager.moveAllToTrusted();
                    return;
                }
                keyManager.removeAll();
            };

            const ACTIONS = {
                add,
                download: keyManager.download,
                remove,
                makePrimary: keyManager.makePrimary
            };

            const BE_ACTIONS = {
                moveToTrusted(target, item) {
                    keyManager.moveToTrusted(target, item);
                    tooltipModel.hideAll();
                },
                moveAllToTrusted: keyManager.moveAllToTrusted,
                downloadUntrusted: keyManager.download
            };

            /**
             * Handles any on click event in the contact public keys, trigger automatically the action described on the
             * element by `data-action`.
             * @param target
             */
            function onClick({ target }) {
                const action = target.getAttribute('data-action');
                const index = parseInt(target.getAttribute('data-index'), 10);
                if (ACTIONS[action]) {
                    ACTIONS[action](scope.UI.items[index], index);
                }
                if (BE_ACTIONS[action]) {
                    BE_ACTIONS[action](scope.BE.items[index], index);
                }
            }

            /**
             * Sequentially triggers compression. Needs to be sequential because confirm modals cannot be called in parallel
             * @param {Array} validKeys
             * @returns {Promise<Array>}
             */
            const compressKeys = (validKeys) => {
                return validKeys.reduce(async (compressPromise, keyInfo) => {
                    // Don't user networkActivityTracker here, we would be tracking stuff double
                    const compressedKeys = await compressPromise;

                    // This can show a modal so we don't want to show the spinner here
                    const compressedKey = await keyCompression.compressKey(keyInfo.publicKeyArmored);

                    if (keyInfo.publicKeyArmored !== compressedKey) {
                        compressedKeys.push(
                            await networkActivityTracker.track(contactKey.keyInfo(compressedKey, email))
                        );
                    } else {
                        compressedKeys.push(keyInfo);
                    }
                    return compressedKeys;
                }, Promise.resolve([]));
            };

            /**
             * Triggered when a new file is selected in the input file element. This triggers adding the file to the
             * advanced settings.
             * @param {Element} target The html element the file is selected in
             * @returns {Promise.<void>}
             */
            const onChange = async ({ target }) => {
                if (!$(target).is('input[type=file]') || !target.files || target.files.length === 0) {
                    return;
                }

                try {
                    // target.files does not support map, so convert it to a real array first.
                    const keys = await networkActivityTracker.track(keyManager.getInfos([...target.files]));

                    const { invalidKeys, validKeys } = keys.reduce(
                        (acc, key) => {
                            if (key.error) {
                                acc.invalidKeys.push(key);
                            } else {
                                acc.validKeys.push(key);
                            }
                            return acc;
                        },
                        { invalidKeys: [], validKeys: [] }
                    );

                    invalidKeys.length && notification.error(I18N.invalidKeyMessage(invalidKeys));

                    // both can handle empty lists
                    const compressedKeys = await compressKeys(validKeys);
                    keyManager.addKeys(compressedKeys);
                } finally {
                    target.value = '';
                }
            };

            element.on('click', onClick);
            element.on('change', onChange);

            on('advancedSettings', (e, { type, data }) => {
                if (type === 'toggleKeyPinning') {
                    toggleKeyPinning(data.status);
                }
            });

            scope.$on('$destroy', () => {
                element.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default contactPublicKeys;
