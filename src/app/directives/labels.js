angular.module("proton.labels", [])

.directive('dropdownLabels', function (
    $timeout,
    $q,
    $rootScope,
    $filter,
    authentication,
    eventManager,
    Label,
    networkActivityTracker,
    notify,
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
            var dropdown = angular.element(element).closest('.pm_buttons').find('.open-label');
            var onClick = function() {
                scope.open();
            };

            dropdown.bind('click', onClick);

            scope.$on('$destroy', function() {
                dropdown.unbind('click', onClick);
            });

            scope.open = function() {
                if (angular.isFunction(scope.getMessages) && angular.isFunction(scope.saveLabels)) {
                    var messagesLabel = [];
                    var messages = scope.getMessages();

                    scope.labelName = '';
                    scope.displayField = false;
                    scope.alsoArchive = false;
                    scope.labels = angular.copy(authentication.user.Labels);

                    _.each(messages, function(message) {
                        messagesLabel = messagesLabel.concat(_.map(message.LabelIDs, function(id) {
                            return id;
                        }));
                    });

                    messagesLabel = _.uniq(messagesLabel);

                    _.each(scope.labels, function(label) {
                        var count = _.filter(messagesLabel, function(m) {
                            return m === label.ID;
                        }).length;

                        label.Selected = count > 0;
                    });

                    $timeout(function() {
                        $('#searchLabels').focus();
                    });
                }
            };

            scope.color = function(label) {
                return {
                    color: label.Color
                };
            };

            scope.save = function() {
                scope.saveLabels(scope.labels, scope.alsoArchive);
                scope.close();
            };

            scope.close = function() {
                $rootScope.$broadcast('closeDropdown');
            };

            scope.labelsSelected = function() {
                return _.where(scope.labels, {Selected: true});
            };

            scope.toggle = function() {
                scope.displayField = !scope.displayField;
            };

            scope.create = function() {
                var name = scope.labelName;
                var colors = tools.colors();
                var index = _.random(0, colors.length - 1);
                var color = colors[index];

                if (scope.labelName.length > 0) {
                    networkActivityTracker.track(
                        Label.create({
                            Name: name,
                            Color: color,
                            Display: 1
                        }).then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                var label = result.data.Label;

                                eventManager.call();
                                scope.labelName = '';
                                scope.displayField = false;
                                label.Selected = true;
                                scope.labels.push(label);
                            } else if (result.data && result.data.Error) {
                                notify({message: result.data.Error, classes: 'notification-danger'});
                            }
                        })
                    );
                } else {
                    scope.displayField = false;
                }
            };
        }
    };
});
