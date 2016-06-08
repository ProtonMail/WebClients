angular.module("proton.labels", [])

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
                    var messagesLabel = [];
                    var messages = scope.getMessages();

                    scope.labelName = '';
                    scope.displayField = false;
                    scope.alsoArchive = Boolean(authentication.user.AlsoArchive);
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
                    networkActivityTracker.track(
                        Label.create({
                            Name: name,
                            Color: color,
                            Display: 1
                        }).then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                var label = result.data.Label;

                                authentication.user.Labels.push(label);
                                scope.labelName = '';
                                scope.displayField = false;
                                label.Selected = true;
                                scope.labels.push(label);
                                scrollDown();
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
