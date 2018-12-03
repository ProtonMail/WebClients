/* @ngInject */
function contactItem(dispatchers, contactTransformLabel, contactUI, contactDetailsModel) {
    const AS_SORTABLE_DISABLED = 'as-sortable-disabled';
    const addX = (value = '') => (value.startsWith('x') ? value : `X-${value}`);

    const MAP_FIELDS = {
        Name: 'FN',
        Emails: 'EMAIL',
        Tels: 'TEL',
        Adrs: 'ADR',
        Notes: 'NOTE',
        Photos: 'PHOTO',
        Scheme: 'X-PM-SCHEME',
        Sign: 'X-PM-SIGN',
        Encrypt: 'X-PM-ENCRYPT',
        MIMEType: 'X-PM-MIMETYPE'
    };
    const getFieldKey = (type = '') => MAP_FIELDS[type] || type.toUpperCase();

    const getInfo = ({ vCard: vcard }, type) => {
        const field = getFieldKey(type);
        return contactDetailsModel.extract({ vcard, field });
    };

    return {
        restrict: 'E',
        require: '^form',
        priority: 90,
        templateUrl: require('../../../templates/directives/contact/contactItem.tpl.html'),
        scope: {
            contact: '=',
            form: '=',
            model: '=',
            type: '@type'
        },
        link(scope, element, attr, ngFormController) {
            const { dispatcher, on, unsubscribe } = dispatchers([
                'contacts',
                'contact.item',
                'composer.new',
                'tooltip'
            ]);
            const list = element.find('.contactItem-container');
            const type = scope.type;
            const datas = getInfo(scope.contact, type);

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
            scope.config = { isFocusedAddress: false };
            scope.UI = contactUI.initialize(datas, type);

            list.addClass(`contactItem-container-${scope.type}`);
            list.addClass(AS_SORTABLE_DISABLED);

            const ACTIONS = {
                add,
                remove: (index) => remove(scope.UI.items[index]),
                toggleSortable() {
                    scope.$applyAsync(() => {
                        // Close dropdown for each item
                        scope.UI.items.forEach((item) => (item.displaySelector = false));
                        scope.UI.sortableState = !scope.UI.sortableState;
                        list.toggleClass(AS_SORTABLE_DISABLED);
                    });
                }
            };

            function onClick(e) {
                e.stopPropagation();
                const action = e.target.getAttribute('data-action');
                const index = parseInt(e.target.getAttribute('data-index'), 10);
                ACTIONS[action] && ACTIONS[action](index);
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
                dispatcher.tooltip('hideAll');
                contactUI.remove(scope.UI, item);
                ngFormController.$setDirty();
                scope.change();
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

            scope.change = () =>
                scope.$applyAsync(() => {
                    scope.model[type] = scope.UI.items;
                    dispatcher['contact.item']('change', { items: scope.UI.items, type: scope.type });
                });
            scope.visibleItems = () => scope.UI.items.filter(({ hide }) => !hide);
            scope.toggleSelector = (event, { uuid, displaySelector }) => {
                scope.UI.items = scope.UI.items.map((item) => {
                    if (uuid === item.uuid) {
                        return { ...item, displaySelector: !displaySelector };
                    }
                    return { ...item, displaySelector: false };
                });
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
