import _ from 'lodash';

/* @ngInject */
function ptDraggableContact(ptDraggleCreator, ptDndModel, AppModel) {
    return ptDraggleCreator(({ scope }, { dispatcher, id }) => {
        const getSelected = () => _.filter(scope.contacts, { selected: true });

        ptDndModel.draggable.set(id, {
            model: scope.contact,
            type: 'contact',
            hookDragStart(target, event) {
                const value = AppModel.get('numberElementChecked');

                if (scope.contact.selected) {
                    // To keep the $scope up to date as we cannot display the notifcation after the digest
                    return scope.$applyAsync(() => {
                        scope.contact.selected = true;
                        AppModel.set('numberElementChecked', value);
                        this.onDragStart(target, event, getSelected());
                    });
                }

                /**
                 * Same behavior as gmail
                 * - 3 selected, select a 4th item, only select it and unselect others. On dragend, re-select the 3 others
                 */
                dispatcher.dnd('hook.dragstart', {
                    before: {
                        number: value,
                        ids: _.map(getSelected(), 'ID')
                    }
                });

                // To keep the $scope up to date as we cannot display the notifcation after the digest
                scope.$applyAsync(() => {
                    scope.contact.selected = true;
                    AppModel.set('numberElementChecked', 1);
                    this.onDragStart(target, event, [scope.contact]);
                });
            }
        });
    });
}
export default ptDraggableContact;
