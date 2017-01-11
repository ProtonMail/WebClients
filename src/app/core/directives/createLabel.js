angular.module('proton.core')
.directive('createLabel', ($rootScope, labelModal, tools, gettextCatalog, eventManager, Label, notify, networkActivityTracker) => {

    const COLORS_LIST = tools.colors();

    const dispatch = (message, label = {}) => {
        $rootScope.$emit('messageActions', {
            action: 'label',
            data: {
                messages: [message],
                labels: [_.extend({}, label, { Selected: true })]
            }
        });
    };

    function createAction(message) {
        return (Name, Color) => {
            const promise = Label.create({ Name, Color, Display: 1 })
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        return eventManager.call()
                            .then(() => {
                                labelModal.deactivate();
                                notify({ message: gettextCatalog.getString('Label created', null), classes: 'notification-success' });
                                message && dispatch(message, data.Label);
                            });
                    }
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                });

            networkActivityTracker.track(promise);
        };
    }

    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/core/createLabel.tpl.html',
        scope: {
            name: '=labelName',
            message: '='
        },
        link(scope) {
            scope.create = () => {
                /**
                 * Open modal to create a new label
                 */
                const index = _.random(0, COLORS_LIST.length - 1);
                const Color = COLORS_LIST[index];
                const title = gettextCatalog.getString('Create new label', null, 'Title');

                labelModal.activate({
                    params: {
                        title,
                        label: { Name: scope.name, Color },
                        create: createAction(scope.message),
                        cancel() {
                            labelModal.deactivate();
                        }
                    }
                });
            };
        }
    };
});
