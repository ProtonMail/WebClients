angular.module('proton.labels')
.directive('dropdownLabels', ($rootScope, $timeout, authentication, eventManager, notify, settingsApi, gettextCatalog) => {

    const NOTIFS = {
        LABELS_SAVED: gettextCatalog.getString('Labels Saved', null),
        LABEL_SAVED: gettextCatalog.getString('Label Saved', null)
    };
    const notifSuccess = (message = '') => notify({ message, classes: 'notification-success' });
    const close = () => $rootScope.$emit('closeDropdown');

    return {
        restrict: 'E',
        templateUrl: 'templates/directives/dropdownLabels.tpl.html',
        replace: true,
        scope: {
            getMessages: '=messages',
            saveLabels: '=save',
            message: '='
        },
        link(scope, element) {
            const dropdown = angular.element(element).closest('.pm_buttons').find('.open-label');
            const $search = angular.element(element[0].querySelector('.dropdown-label-search-input'));

            const onClickDropdown = () => {
                scope.$applyAsync(() => {
                    if (!angular.isFunction(scope.getMessages) && !angular.isFunction(scope.saveLabels)) {
                        return;
                    }

                    const messages = scope.getMessages();
                    const labels = _.where(authentication.user.Labels, { Exclusive: 0 });

                    scope.labelName = '';
                    scope.alsoArchive = Boolean(authentication.user.AlsoArchive);
                    scope.labels = angular.copy(labels);

                    const messagesLabels = _.reduce(messages, (acc, { LabelIDs = [] }) => acc.concat(LabelIDs), []);

                    scope.labels.forEach((label) => {
                        const count = messagesLabels.filter((id) => id === label.ID).length;

                        if (count > 0 && count < messages.length) {
                            label.Selected = null;
                        } else {
                            label.Selected = (count > 0);
                        }
                    });

                    $timeout(() => $search.focus(), 100, false);
                });
            };

            const onSubmit = (e) => {
                e.stopPropagation();
                scope.$applyAsync(() => {
                    $rootScope.numberElementChecked = 0;
                    scope.saveLabels(scope.labels, scope.alsoArchive);
                    close();
                    notifSuccess(NOTIFS.LABELS_SAVED);
                });
            };

            const onClick = (e) => {
                if (e.target.nodeName !== 'LI' || e.target.nodeName !== 'LABEL') {
                    return;
                }
                const ID = e.target.getAttribute('data-label-id');
                // If we don't find a label via the search we click on the "not found" li
                ID && scope.$applyAsync(() => {
                    const label = _.findWhere(scope.labels, { ID });
                    label.Selected = true;
                    scope.saveLabels(scope.labels, scope.alsoArchive);
                    close();
                    notifSuccess(NOTIFS.LABEL_SAVED);
                });
            };

            element.on('submit', onSubmit);
            element.on('click', onClick);
            dropdown.on('click', onClickDropdown);

            scope.color = ({ Color: color = 'inherit' } = {}) => ({ color });

            scope.changeAlsoArchive = () => {
                settingsApi.alsoArchive({ AlsoArchive: +scope.alsoArchive })
                    .then(({ data = {} } = {}) => (data.Code === 1000 && eventManager.call()));
            };

            scope.$on('$destroy', () => {
                dropdown.off('click', onClickDropdown);
                element.off('submit', onSubmit);
                element.off('click', onClick);
            });

        }
    };
});
