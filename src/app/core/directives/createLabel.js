angular.module('proton.core')
.directive('createLabel', (labelModal, tools, gettextCatalog, eventManager, Label, notify, networkActivityTracker) => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/core/createLabel.tpl.html',
        scope: {
            name: '=labelName'
        },
        link(scope) {
            scope.create = () => {
                /**
                 * Open modal to create a new label
                 */
                const colors = tools.colors();
                const index = _.random(0, colors.length - 1);
                const color = colors[index];

                labelModal.activate({
                    params: {
                        title: gettextCatalog.getString('Create new label', null, 'Title'),
                        label: { Name: scope.name, Color: color },
                        create(name, color) {
                            const promise = Label.create({ Name: name, Color: color, Display: 1 })
                            .then((result) => {
                                if (result.data && result.data.Code === 1000) {
                                    return eventManager.call()
                                    .then(() => {
                                        labelModal.deactivate();
                                        notify({ message: gettextCatalog.getString('Label created', null), classes: 'notification-success' });
                                    });
                                } else if (result.data && result.data.Error) {
                                    return Promise.reject(result.data.Error);
                                }
                            });

                            networkActivityTracker.track(promise);
                        },
                        cancel() {
                            labelModal.deactivate();
                        }
                    }
                });
            };
        }
    };
});
