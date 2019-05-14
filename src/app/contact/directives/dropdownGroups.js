/* @ngInject */
function dropdownGroups(
    contactGroupModal,
    contactGroupModel,
    dispatchers,
    networkActivityTracker,
    moveContactGroupHandler
) {
    return {
        scope: {
            contact: '=',
            model: '=',
            action: '=',
            type: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/dropdownGroups.tpl.html'),
        link(scope, el) {
            let latestId;

            const { on, unsubscribe, dispatcher } = dispatchers(['contacts', 'dropdown']);
            const isContactAdd = scope.action === 'addToContact';

            scope.color = ({ Color: color = 'inherit' } = {}) => ({ color });
            const manager = moveContactGroupHandler.manage(scope.action, scope.type, {
                email: scope.model,
                contact: scope.contact
            });

            debugger;

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

                if (target.dataset.action === 'apply') {
                    scope.$applyAsync(async () => {
                        const { mode } = await manager(scope.labels);
                        mode === 'submit' && dispatcher.dropdown('close');
                    });
                }
            };

            /**
             * When you open the dropdown we extract the current groups
             * attached to the selected contacts
             */
            const showSelection = (extendID) => {
                const { map, selected } = moveContactGroupHandler.getEnv(scope.type, {
                    email: scope.model,
                    contact: scope.contact
                });

                const groups = contactGroupModel.get().map((group) => {
                    // For this mode we ONLY add groups, no need to bind the selection
                    if (isContactAdd) {
                        return group;
                    }

                    const count = map[group.ID] || 0;
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
