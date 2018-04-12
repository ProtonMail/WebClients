import _ from 'lodash';

/* @ngInject */
function dropdownLabels(
    $rootScope,
    $timeout,
    labelsModel,
    mailSettingsModel,
    eventManager,
    notification,
    settingsMailApi,
    gettextCatalog
) {
    const NOTIFS = {
        LABELS_SAVED: gettextCatalog.getString('Labels Saved', null, 'dropdown label'),
        LABEL_SAVED: gettextCatalog.getString('Label Saved', null, 'dropdown label')
    };
    const close = () => $rootScope.$emit('closeDropdown');

    const mapLabelsMessage = (elements = []) => {
        return _.reduce(
            elements,
            (acc, { LabelIDs = [], Labels = [] }) => {
                if (Labels.length) {
                    Labels.forEach(({ ID }) => (!acc[ID] ? (acc[ID] = 1) : acc[ID]++));
                    return acc;
                }
                LabelIDs.forEach((id) => (!acc[id] ? (acc[id] = 1) : acc[id]++));
                return acc;
            },
            {}
        );
    };

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/directives/dropdownLabels.tpl.html'),
        replace: true,
        scope: {
            getMessages: '=messages',
            saveLabels: '=save',
            message: '='
        },
        link(scope, element) {
            const dropdown = angular
                .element(element)
                .closest('.pm_buttons')
                .find('.open-label');
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
                    scope.alsoArchive = Boolean(mailSettingsModel.get('AlsoArchive'));

                    scope.labels.forEach((label) => {
                        const count = messagesLabels[label.ID] || 0;
                        if (count > 0 && count < messages.length) {
                            label.Selected = null;
                        } else {
                            label.Selected = count > 0;
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
                    notification.success(NOTIFS.LABELS_SAVED);
                });
            };

            const onClick = (e) => {
                if (e.target.nodeName === 'I') {
                    const ID = e.target.getAttribute('data-label-id');
                    ID &&
                        scope.$applyAsync(() => {
                            const label = _.find(scope.labels, { ID });
                            label.Selected = true;
                            scope.saveLabels(scope.labels, scope.alsoArchive);
                            close();
                            notification.success(NOTIFS.LABEL_SAVED);
                        });
                }
            };

            element.on('submit', onSubmit);
            element.on('click', onClick);
            dropdown.on('click', onClickDropdown);

            scope.color = ({ Color: color = 'inherit' } = {}) => ({ color });

            scope.changeAlsoArchive = () => {
                settingsMailApi.updateAlsoArchive({ AlsoArchive: +scope.alsoArchive });
            };

            scope.$on('$destroy', () => {
                dropdown.off('click', onClickDropdown);
                element.off('submit', onSubmit);
                element.off('click', onClick);
            });
        }
    };
}
export default dropdownLabels;
