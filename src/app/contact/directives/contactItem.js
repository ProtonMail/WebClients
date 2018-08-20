import { normalizeEmail } from '../../../helpers/string';
import { isOwnAddress } from '../../../helpers/address';

/* @ngInject */
function contactItem(
    dispatchers,
    contactTransformLabel,
    contactUI,
    messageModel,
    addressesModel,
    contactEncryptionModal,
    contactEncryptionSaver,
    keyCache,
    networkActivityTracker
) {
    const AS_SORTABLE_DISABLED = 'as-sortable-disabled';
    const addX = (value = '') => (value.startsWith('x') ? value : `X-${value}`);

    return {
        restrict: 'E',
        require: '^form',
        templateUrl: require('../../../templates/directives/contact/contactItem.tpl.html'),
        scope: {
            form: '=',
            model: '=',
            state: '=',
            getDatas: '&datas',
            type: '@type'
        },
        link(scope, element, attr, ngFormController) {
            const { on, unsubscribe, dispatcher } = dispatchers(['contacts', 'contact.item', 'composer.new']);
            const datas = scope.getDatas();
            const type = scope.type;
            const state = scope.state;
            const list = element.find('.contactItem-container');

            scope.config = { isFocusedAddress: false };

            list.addClass(`contactItem-container-${scope.type}`);
            list.addClass(AS_SORTABLE_DISABLED);

            function onClick(e) {
                e.stopPropagation();
                const action = e.target.getAttribute('data-action');
                const index = parseInt(e.target.getAttribute('data-index'), 10);
                switch (action) {
                    case 'advanced':
                        advanced(index);
                        break;
                    case 'add':
                        add();
                        break;
                    case 'composeTo':
                        composeTo(e.target.getAttribute('data-email'));
                        break;
                    case 'remove':
                        remove(scope.UI.items[index]);
                        break;
                    case 'toggleSortable':
                        scope.$applyAsync(() => {
                            scope.UI.sortableState = !scope.UI.sortableState;
                            list.toggleClass(AS_SORTABLE_DISABLED);
                        });
                        break;
                    default:
                        break;
                }
            }

            function advanced(index) {
                const itemObject = scope.UI.items[index];
                const emailAddress = itemObject.value;
                const promise = keyCache
                    .get([emailAddress])
                    .then(({ [emailAddress]: result }) => result)
                    .then((internalKeys) => {
                        const { settings = {} } = itemObject;
                        const { Email: { value: oldEmail = '' } = {} } = settings;
                        const hasChangedEmail = !oldEmail || normalizeEmail(emailAddress) !== normalizeEmail(oldEmail);
                        const model = hasChangedEmail ? {} : { ...settings };
                        delete model.Email;

                        const directSave = !!scope.state.ID;
                        const save = (model) => {
                            scope.$applyAsync(() => {
                                model.Email = { ...scope.UI.items[index], settings: undefined };
                                scope.UI.items[index].settings = model;

                                if (directSave) {
                                    const promise = contactEncryptionSaver.save(scope.model, scope.state.ID, index);

                                    networkActivityTracker.track(promise);
                                    scope.form.$setPristine();
                                }

                                contactEncryptionModal.deactivate();
                            });
                        };

                        contactEncryptionModal.activate({
                            params: {
                                email: scope.UI.items[index].value,
                                model,
                                save,
                                directSave,
                                close: () => contactEncryptionModal.deactivate(),
                                internalKeys,
                                form: scope.form
                            }
                        });
                    });
                networkActivityTracker.track(promise);
            }

            function add() {
                const populated = contactUI.populate(scope.UI, type);
                ngFormController.$setDirty();
                scope.$applyAsync(() => {
                    contactUI.add(scope.UI, populated.key, populated.type, '');
                    setTimeout(() => element.find('.contactItem-field').focus(), 100);
                });
            }

            function remove(item) {
                // Hide all the tooltip
                $('.tooltip')
                    .not(this)
                    .hide();
                contactUI.remove(scope.UI, item);
                ngFormController.$setDirty();
                scope.change();
            }

            function composeTo(Address) {
                const message = messageModel();
                message.ToList = [{ Address, Name: Address }];
                dispatcher['composer.new']('new', { message });
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
            if (scope.UI.mode === 'toggle') {
                on(scope.UI.inputName + '.toggle', (target, { data: { status: value } }) => {
                    scope.model[type][0].value = value;
                    ngFormController.$setDirty();
                    scope.change();
                });
            }

            scope.getAddressValue = (item) => {
                const itemValue = item.value;

                if (angular.isArray(itemValue)) {
                    return itemValue.join(' ');
                }

                if (angular.isString(itemValue)) {
                    return itemValue;
                }

                return '';
            };

            scope.isOwnAddress = (email) => {
                const address = addressesModel.getByEmail(email);
                const { Keys } = keyCache.getUserAddressesKeys(address) || {};

                return isOwnAddress(address, Keys);
            };

            scope.change = () =>
                scope.$applyAsync(() => {
                    scope.model[type] = scope.UI.items;
                    dispatcher['contact.item']('change', { items: scope.UI.items, type: scope.type });
                });
            scope.visibleItems = () => scope.UI.items.filter(({ hide }) => !hide);
            scope.toggleSelector = (event, item) => {
                item.displaySelector = !item.displaySelector;
                event.preventDefault();
                event.stopPropagation();
            };

            scope.setLabel = (item = {}, value = '') => {
                item.label = value || item.label;

                if (type === 'Customs') {
                    item.type = addX(item.label);
                }

                if (type === 'Personals') {
                    item.type = contactTransformLabel.toVCard(item.label);
                }

                ngFormController.$setDirty();
                scope.change();
                item.displaySelector = false;
            };

            scope.change();

            element.on('click', onClick);

            on('contacts', (e, { type = '' }) => {
                if (!list.hasClass(AS_SORTABLE_DISABLED) && (type === 'updateContact' || type === 'createContact')) {
                    scope.$applyAsync(() => {
                        scope.UI.sortableState = false;
                        list.addClass(AS_SORTABLE_DISABLED);
                    });
                }
            });

            scope.$on('$destroy', () => {
                element.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default contactItem;
