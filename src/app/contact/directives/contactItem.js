import _ from 'lodash';

/* @ngInject */
function contactItem(
    dispatchers,
    contactTransformLabel,
    contactUI,
    messageModel,
    addressesModel,
    contactEncryptionModal,
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
                const promise = keyCache
                    .get([scope.UI.items[index].value])
                    .then(({ [scope.UI.items[index].value]: result }) => result)
                    .then((internalKeys) =>
                        contactEncryptionModal.activate({
                            params: {
                                email: scope.UI.items[index].value,
                                model: scope.UI.items[index].settings,
                                save: (model) => {
                                    scope.$applyAsync(() => {
                                        scope.UI.items[index].settings = model;
                                        contactEncryptionModal.deactivate();
                                        scope.form.$setDirty();
                                    });
                                },
                                close: () => contactEncryptionModal.deactivate(),
                                internalKeys,
                                form: scope.form
                            }
                        })
                    );
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
                on(scope.UI.inputName + '.toggle', (target, { status: value }) => {
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

            scope.isOwnAddress = (email) =>
                _.map(addressesModel.get(), 'Email').includes(email.toLowerCase().replace(/\+[^@]*@/, ''));

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
