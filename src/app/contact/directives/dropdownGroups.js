import { info as infoError } from '../../../helpers/errors';

/* @ngInject */
function dropdownGroups(
    contactGroupModal,
    contactGroupModel,
    dispatchers,
    networkActivityTracker,
    manageContactGroup,
    contactCache,
    contactEmails
) {
    const mapGroups = (list = []) => {
        return list.reduce((acc, { LabelIDs = [] }) => {
            LabelIDs.forEach((id) => (!acc[id] ? (acc[id] = 1) : acc[id]++));
            return acc;
        }, Object.create(null));
    };

    const toError = infoError('dropdownGroups');

    return {
        scope: {
            model: '=',
            type: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/dropdownGroups.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe, dispatcher } = dispatchers(['contacts', 'dropdown']);
            let MAP;
            let selected;
            let latestId;

            const manageGroup = manageContactGroup[scope.type || 'contact'];

            if (!['contact', 'email'].includes(scope.type)) {
                throw new Error(toError(`Wrong type: ${scope.type}`, 'Expected value: contact or email'));
            }

            scope.color = ({ Color: color = 'inherit' } = {}) => ({ color });

            /**
             * Find groups to unlabel/label for a list of contacts.
             * @param  {Array}  labels           List of groups
             * @param  {Object} mapLabel         Ids of groups already attached to the list of contacts selected.   <ID:String>:<Quantity:Number>
             * @param  {Array}  selectedContacts Contact selected from the contact list
             */
            const manageLabels = (labels = [], mapLabel = {}, selectedContacts = []) => {
                const { label, unlabel } = labels.reduce(
                    (acc, { Selected, ID }) => {
                        // Null means it's attached to at least one contact but not all
                        mapLabel[ID] && !Selected && Selected !== null && acc.unlabel.push(ID);
                        Selected && acc.label.push(ID);
                        return acc;
                    },
                    { unlabel: [], label: [] }
                );

                manageGroup.attach(label, selectedContacts);
                manageGroup.detach(unlabel, selectedContacts);
                dispatcher.dropdown('close');
            };

            const onClick = ({ target }) => {
                if (target.dataset.action === 'create') {
                    contactGroupModal.activate({
                        params: {
                            model: {
                                Name: scope.searchValue
                            },
                            close() {
                                contactGroupModal.deactivate();
                                networkActivityTracker.track(contactGroupModel.load(true));
                            }
                        }
                    });
                }

                if (target.dataset.action === 'apply' && selected) {
                    scope.$applyAsync(() => {
                        manageLabels(scope.labels, MAP, selected);
                    });
                }
            };

            const getSelected = () => {
                if (scope.type === 'email') {
                    return [contactEmails.findEmail(scope.model)];
                }
                return contactCache.get('selected');
            };

            /**
             * When you open the dropdown we extract the current groups
             * attached to the selected contacts
             */
            const showSelection = (extendID) => {
                selected = getSelected();
                MAP = mapGroups(selected);

                const groups = contactGroupModel.get().map((group) => {
                    const count = MAP[group.ID] || 0;
                    // At least one contact has this group, but not all contacts
                    if (count > 0 && count < selected.length) {
                        group.Selected = null;
                    } else {
                        group.Selected = count > 0;
                    }

                    if (extendID && group.ID === extendID) {
                        group.Selected = true;
                    }

                    return group;
                });

                latestId = undefined;
                scope.$applyAsync(() => {
                    scope.labels = groups;
                });
            };

            on('dropdown', (e, { type, data = {} }) => {
                type === 'show' && data.type === scope.type && showSelection();
            });

            on('contactGroupModel', (e, { type, data = {} }) => {
                type === 'cache.refresh' && showSelection(latestId);

                if (type === 'cache.update') {
                    const [{ ID } = {}] = data.create;
                    latestId = ID;
                    showSelection(ID);
                }
            });
            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default dropdownGroups;
