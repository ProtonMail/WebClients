import _ from 'lodash';

/* @ngInject */
function emailBlockList(dispatchers, gettextCatalog, spamListModel) {
    const I18N = {
        whitelist: gettextCatalog.getString('Whitelist', null, 'Info'),
        blacklist: gettextCatalog.getString('Blacklist', null, 'Info')
    };

    const SCROLL_THROTTLE = 100;
    // fetch when less than TRIGGER_BOUNDARY entries are below the bottom of the table view
    const TRIGGER_BOUNDARY = 50;
    const CLASSNAMES = {
        LIST: 'emailBlockList-list',
        BTN_SWITCH: 'emailBlockList-btn-switch',
        BTN_DELETE: 'emailBlockList-btn-delete'
    };

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/filter/emailBlockList.tpl.html'),
        scope: {
            listType: '@'
        },
        link(scope, elem, { switchTo }) {
            const { on, unsubscribe } = dispatchers();
            const list = spamListModel.list(spamListModel.getType(scope.listType));
            const tbody = elem[0].querySelector(`.${CLASSNAMES.LIST}`);

            scope.filterName = I18N[scope.listType];

            list.get().then((list) => {
                scope.$applyAsync(() => (scope.entries = list));
            });

            on('filters', () => {
                list.get().then((list) => {
                    scope.$applyAsync(() => {
                        scope.entries = _.uniqBy(list, 'ID');
                        $('.tooltip').hide();
                    });
                });
            });

            const onScroll = _.throttle(() => {
                if (list.isLoading() || list.isEnding()) {
                    return;
                }

                const elementCount = scope.entries.length;
                const triggerFetch = elementCount - TRIGGER_BOUNDARY;
                const scrollBottom = tbody.scrollTop + tbody.clientHeight;

                // check if we have reached the last TRIGGER_BOUNDARY elements
                if (scrollBottom / tbody.scrollHeight > triggerFetch / elementCount) {
                    list.get().then((list) => {
                        scope.$applyAsync(() => {
                            scope.entries = _.uniqBy(scope.entries.concat(list), 'ID');
                        });
                    });
                }
            }, SCROLL_THROTTLE);

            const onClick = ({ target }) => {
                if (target.nodeName !== 'BUTTON') {
                    return;
                }

                if (target.classList.contains(CLASSNAMES.BTN_SWITCH)) {
                    spamListModel.move(target.dataset.entryId, spamListModel.getType(switchTo));
                }

                if (target.classList.contains(CLASSNAMES.BTN_DELETE)) {
                    spamListModel.destroy(target.dataset.entryId);
                }
            };

            tbody.addEventListener('scroll', onScroll);
            elem[0].addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                tbody.removeEventListener('scroll', onScroll);
                elem[0].removeEventListener('click', onClick);
                unsubscribe();
                spamListModel.clear();
            });
        }
    };
}
export default emailBlockList;
