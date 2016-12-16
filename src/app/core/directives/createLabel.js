angular.module('proton.core')
.directive('createLabel', (Label, eventManager, tools, networkActivityTracker) => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/core/createLabel.tpl.html',
        scope: {
            display: '=display',
            labelName: '=labelName',
            labels: '=labels'
        },
        link(scope, element) {

            const scrollDown = () => {
                const list = angular.element(element).parent().find('.list-group').first();
                list.scrollTop = list.scrollHeight;
            };

            scope.create = () => {

                const name = scope.labelName;
                const colors = tools.colors();
                const index = _.random(0, colors.length - 1);
                const color = colors[index];

                if (scope.labelName.length > 0) {
                    const promise = Label.create({ Name: name, Color: color, Display: 1 });

                    promise.then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            return eventManager.call()
                            .then(() => {
                                const label = result.data.Label;

                                label.Selected = true;
                                scope.labels.push(label);
                                scope.labelName = '';
                                scope.display = false;

                                scrollDown();

                            });
                        } else if (result.data && result.data.Error) {
                            return Promise.reject(result.data.Error);
                        }
                    });

                    networkActivityTracker.track(promise);
                } else {
                    scope.display = false;
                }
            };


        }
    };
});
