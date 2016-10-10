angular.module('proton.labels', ['ui.indeterminate'])

.directive('dropdownLabels', function (
    $filter,
    $q,
    $rootScope,
    $timeout,
    authentication,
    eventManager,
    Label,
    networkActivityTracker,
    notify,
    Setting,
    gettextCatalog,
    tools
) {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/labels.tpl.html',
        replace: true,
        scope: {
            getMessages: '=messages',
            saveLabels: '=save'
        },
        link: function(scope, element, attrs) {
            // Variables
            var dropdown = angular.element(element).closest('.pm_buttons').find('.open-label');

            // Functions
            var onClick = function() {
                scope.open();
            };

            var scrollDown = function() {
                var list = angular.element(element).find('.list-group').first();

                list.scrollTop = list.scrollHeight;
            };

            // Listeners
            dropdown.bind('click', onClick);

            scope.$on('$destroy', function() {
                dropdown.unbind('click', onClick);
            });

            scope.open = function() {
                if (angular.isFunction(scope.getMessages) && angular.isFunction(scope.saveLabels)) {
                    const messages = scope.getMessages();

                    scope.labelName = '';
                    scope.displayField = false;
                    scope.alsoArchive = Boolean(authentication.user.AlsoArchive);
                    scope.labels = angular.copy(authentication.user.Labels);

                    let messagesLabels = [];
                    messages.forEach(message => {
                        messagesLabels = messagesLabels.concat(message.LabelIDs);
                    });

                    scope.labels.forEach(label => {
                        const count = messagesLabels.filter(id => id === label.ID).length;

                        if (count > 0 && count < messages.length) {
                            label.Selected = null;
                        } else {
                            label.Selected = (count > 0);
                        }
                    });

                    $timeout(() => {
                        angular.element("[ng-model='searchLabels']").focus();
                    }, 100);
                }
            };

            scope.color = function(label) {
                if (label && label.Color) {
                    return { color: label.Color };
                } else {
                    return {};
                }
            };

            scope.save = function() {
                $rootScope.numberElementChecked = 0;
                $rootScope.showWelcome = true;
                scope.saveLabels(scope.labels, scope.alsoArchive);
                scope.close();
                notify({message: gettextCatalog.getString('Labels Saved', null), classes: 'notification-success'});
            };

            scope.changeAlsoArchive = function() {
                var archive = scope.alsoArchive ? 1 : 0;

                Setting.alsoArchive({AlsoArchive: archive})
                .then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        eventManager.call();
                    }
                });
            };

            scope.moveTo = function(label) {
                // Select just one
                label.Selected = true;
                // Save
                scope.saveLabels(scope.labels, scope.alsoArchive);
                // Close
                scope.close();
                // Notify the user
                notify({message: gettextCatalog.getString('Label Saved', null), classes: 'notification-success'});
            };

            scope.close = function() {
                $rootScope.$broadcast('closeDropdown');
            };

            scope.labelsSelected = function() {
                return _.where(scope.labels, {Selected: true});
            };

            scope.toggle = function() {
                scope.displayField = !scope.displayField;

                if (scope.displayField === true) {
                    $timeout(function() {
                        angular.element("[ng-model='labelName']").focus();
                    }, 100);
                }
            };

            scope.create = function() {
                var name = scope.labelName;
                var colors = tools.colors();
                var index = _.random(0, colors.length - 1);
                var color = colors[index];

                if (scope.labelName.length > 0) {
                    const promise = Label.create({ Name: name, Color: color, Display: 1});

                    promise.then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            return eventManager.call()
                            .then(() => {
                                const label = result.data.Label;

                                label.Selected = true;

                                scope.labels.push(label);
                                scope.labelName = '';
                                scope.displayField = false;

                                scrollDown();
                            });
                        } else if (result.data && result.data.Error) {
                            return Promise.reject(result.data.Error);
                        }
                    });

                    networkActivityTracker.track(promise);
                } else {
                    scope.displayField = false;
                }
            };
        }
    };
});
