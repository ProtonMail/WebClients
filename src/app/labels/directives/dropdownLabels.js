import _ from 'lodash';

/* @ngInject */
function dropdownLabels(
    $timeout,
    AppModel,
    dispatchers,
    labelsModel,
    notification,
    gettextCatalog,
    translator,
    labelModal
) {
    const I18N = translator(() => ({
        LABELS_SAVED: gettextCatalog.getString('Labels Saved', null, 'dropdown label'),
        LABEL_SAVED: gettextCatalog.getString('Label Saved', null, 'dropdown label')
    }));

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
            Object.create(null)
        );
    };

    function link(scope, el) {
        const { dispatcher, on, once, unsubscribe } = dispatchers(['dropdownApp', 'requestElements', 'messageActions']);

        // We can't pass the prop due to the $digest. Most simple solution here
        const getID = () => el[0].parentElement.getAttribute('data-dropdown-id');

        let dropdownId = getID();
        const $search = angular.element(el[0].querySelector('.dropdown-label-search-input'));
        const $createBtn = el.find('.dropdown-label-create');

        // When we use the message inside the scope... 💥 so --force works ¯\_(ツ)_/¯
        if (dropdownId === 'null') {
            scope.$applyAsync(() => {
                dropdownId = getID();
            });
        }

        const clean = () => {
            scope.$applyAsync(() => {
                scope.searchLabels = '';
                scope.alsoArchive = false;
            });
        };

        const lockDropdown = (value = true) => dispatcher.dropdownApp('lock', { id: dropdownId, value });

        const close = () => {
            dispatcher.dropdownApp('action', { type: 'close', id: dropdownId });
            clean();
        };

        const loadMessage = (cb) => {
            if (scope.message) {
                return cb([scope.message]);
            }

            dispatcher.requestElements('get.selection');
            return once('requestElements', (e, { type, data }) => {
                if (type === 'give.selection') {
                    cb(data);
                }
            });
        };

        const onSubmit = (e) => {
            e.stopPropagation();
            scope.$applyAsync(() => {
                if (scope.message) {
                    dispatcher.messageActions('label', {
                        messages: [scope.message],
                        labels: scope.labels,
                        alsoArchive: scope.alsoArchive
                    });
                    notification.success(I18N.LABELS_SAVED);
                    return close();
                }

                AppModel.set('numberElementChecked', 0);
                dispatcher.requestElements('saveLabels', {
                    labels: scope.labels,
                    alsoArchive: scope.alsoArchive
                });

                close();
                notification.success(I18N.LABELS_SAVED);
            });
        };

        const onClick = (e) => {
            if (e.target.classList.contains('dropdown-label-scrollbox-label-icon')) {
                const ID = e.target.getAttribute('data-label-id');
                ID &&
                    scope.$applyAsync(() => {
                        const label = _.find(scope.labels, { ID });
                        label.Selected = true;
                        dispatcher.requestElements('saveLabels', {
                            labels: scope.labels,
                            alsoArchive: scope.alsoArchive
                        });
                        close();
                        notification.success(I18N.LABEL_SAVED);
                    });
            }
        };

        const onClickCreate = () => {
            lockDropdown();
            labelModal.activate({
                params: {
                    label: {
                        Name: scope.searchLabels,
                        Exclusive: 0
                    },
                    hookClose: () => lockDropdown(false),
                    onSuccess(label) {
                        if (scope.message) {
                            dispatcher.messageActions('label', {
                                messages: [scope.message],
                                labels: [{ ...label, Selected: true }]
                            });
                            return close();
                        }

                        scope.labels && scope.labels.push({ ...label, Selected: true });

                        // Auto scroll to the latest item added
                        setTimeout(() => {
                            const $list = el[0].querySelector('.dropdownLabels-list');
                            $list.scrollTo(0, $list.scrollHeight);
                        }, 500);
                    }
                }
            });
        };

        on('dropdownApp', (e, { type, data = {} }) => {
            // Restrict the ID because we need to cache the content and prevent issues if we load the same content twice -> toolabr and message
            if (data.id !== dropdownId) {
                return;
            }

            if (type === 'state' && data.isOpened) {
                loadMessage((messages) => {
                    const messagesLabels = mapLabelsMessage(messages);

                    scope.$applyAsync(() => {
                        scope.labelName = '';
                        scope.labels = labelsModel.get('labels');
                        scope.alsoArchive = false;

                        scope.labels.forEach((label) => {
                            const count = messagesLabels[label.ID] || 0;
                            if (count > 0 && count < messages.length) {
                                label.Selected = null;
                            } else {
                                label.Selected = count > 0;
                            }
                        });
                    });

                    $timeout(() => $search.focus(), 100, false);
                });
            }

            if (type === 'state' && !data.isOpened) {
                clean();
            }
        });

        el.on('submit', onSubmit);
        $createBtn.on('click', onClickCreate);
        el.on('click', onClick);

        scope.color = ({ Color: color = 'inherit' } = {}, key = 'color') => ({ [key]: color });

        scope.$on('$destroy', () => {
            el.off('submit', onSubmit);
            el.off('click', onClick);
            $createBtn.off('click', onClickCreate);
            unsubscribe();
        });
    }

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/directives/dropdownLabels.tpl.html'),
        replace: true,
        scope: {
            message: '='
        },
        link(scope, ...attrs) {
            scope.$applyAsync(() => {
                link(scope, ...attrs);
            });
        }
    };
}
export default dropdownLabels;
