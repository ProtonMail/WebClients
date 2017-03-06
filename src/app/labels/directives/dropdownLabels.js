angular.module('proton.labels')
.directive('dropdownLabels', ($rootScope, $timeout, labelsModel, authentication, eventManager, notify, settingsApi, gettextCatalog) => {

    const NOTIFS = {
        LABELS_SAVED: gettextCatalog.getString('Labels Saved', null),
        LABEL_SAVED: gettextCatalog.getString('Label Saved', null)
    };
    const notifSuccess = (message = '') => notify({ message, classes: 'notification-success' });
    const close = () => $rootScope.$emit('closeDropdown');

    const mapLabelsMessage = (messages = []) => {
        return _.reduce(messages, (acc, { LabelIDs = [] }) => {
            LabelIDs.forEach((id) => (!acc[id] ? acc[id] = 1 : acc[id]++));
            return acc;
        }, {});
    };

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
                    const messagesLabels = mapLabelsMessage(messages);

                    scope.labelName = '';
                    scope.labels = labelsModel.get('labels');
                    scope.alsoArchive = Boolean(authentication.user.AlsoArchive);

                    scope.labels.forEach((label) => {
                        const count = messagesLabels[label.ID] || 0;
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
                if (e.target.nodeName === 'I') {
                    const ID = e.target.getAttribute('data-label-id');
                    ID && scope.$applyAsync(() => {
                        const label = _.findWhere(scope.labels, { ID });
                        label.Selected = true;
                        scope.saveLabels(scope.labels, scope.alsoArchive);
                        close();
                        notifSuccess(NOTIFS.LABEL_SAVED);
                    });
                }
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
