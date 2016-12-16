angular.module('proton.ui')
.directive('dropdownLabels', (
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
    gettextCatalog
) => {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/dropdownLabels.tpl.html',
        replace: true,
        scope: {
            getMessages: '=messages',
            saveLabels: '=save'
        },
        link(scope, element) {
            // Variables
            const dropdown = angular.element(element).closest('.pm_buttons').find('.open-label');

            // Functions
            const onClick = () => {
                scope.open();
            };

            // Listeners
            dropdown.bind('click', onClick);

            scope.$on('$destroy', () => {
                dropdown.unbind('click', onClick);
            });

            scope.open = () => {
                if (angular.isFunction(scope.getMessages) && angular.isFunction(scope.saveLabels)) {
                    const messages = scope.getMessages();

                    scope.labelName = '';
                    scope.alsoArchive = Boolean(authentication.user.AlsoArchive);
                    scope.labels = angular.copy(authentication.user.Labels);

                    let messagesLabels = [];
                    messages.forEach((message) => {
                        messagesLabels = messagesLabels.concat(message.LabelIDs);
                    });

                    scope.labels.forEach((label) => {
                        const count = messagesLabels.filter((id) => id === label.ID).length;

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

            scope.color = ({ Color } = {}) => {
                return Color ? { color: Color } : {};
            };

            scope.save = () => {
                $rootScope.numberElementChecked = 0;
                $rootScope.showWelcome = true;
                scope.saveLabels(scope.labels, scope.alsoArchive);
                scope.close();
                notify({ message: gettextCatalog.getString('Labels Saved', null), classes: 'notification-success' });
            };

            scope.changeAlsoArchive = () => {
                const archive = scope.alsoArchive ? 1 : 0;

                Setting.alsoArchive({ AlsoArchive: archive })
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        eventManager.call();
                    }
                });
            };

            scope.moveTo = (label) => {
                // Select just one
                label.Selected = true;
                // Save
                scope.saveLabels(scope.labels, scope.alsoArchive);
                // Close
                scope.close();
                // Notify the user
                notify({ message: gettextCatalog.getString('Label Saved', null), classes: 'notification-success' });
            };

            scope.close = () => {
                $rootScope.$emit('closeDropdown');
            };

            scope.labelsSelected = () => {
                return _.where(scope.labels, { Selected: true });
            };

        }
    };
});
