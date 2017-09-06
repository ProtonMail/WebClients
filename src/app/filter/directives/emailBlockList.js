angular.module('proton.filter')
    .directive('emailBlockList', ($rootScope, spamListModel) => {

        const SCROLL_THROTTLE = 100;
        const TRIGGER_BOUNDARY = 100;

        const onEvent = (element, type, callback) => {
            element.addEventListener(type, callback);
            return () => element.removeEventListener(type, callback);
        };


        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/emailBlockList.tpl.html',
            scope: {},
            compile(elem, { filterName, listType }) {

                const filterNameNodes = elem[0].querySelectorAll('.email-block-list-name');
                _.each(filterNameNodes, (node) => node.textContent = filterName);


                const tbody = elem[0].querySelector('.block-list > table > tbody');
                const row = tbody.querySelector('.block-list tr');
                tbody.removeChild(row);


                // const table = elem[0].querySelector('[data-email-block-list-entry]');
                // table.dataset.switchTo = switchTo;
                // table.dataset.listType = listType;

                // link
                return (scope) => {
                    const unsubscribe = [];

                    const list = spamListModel.getList(listType);

                    let oldEntries = [];
                    const renderList = () => {

                        // update the table really quickly.

                        // loop over each element. if not in new entries -> remove
                        // otherwise advance
                        //

                        const html = _.map(_.difference(scope.entries, oldEntries),
                            (entry) => `<tr>
                        <td class="blocklist-email-value">${entry.Email}</td>
                        <td class="text-right">
                            <button class="pm_button link blocklist-email-switch" pt-tooltip-translate="Switch">
                                <i class="fa fa-arrows-h"></i>
                            </button>
                            <button class="pm_button link blocklist-email-delete" pt-tooltip-translate="Delete">
                                <i class="fa fa-times text-red"></i>
                            </button>
                        </td>
                    </tr>`).join('');

                        tbody.insertAdjacentHTML('beforeend', html);
                        oldEntries = scope.entries.slice();
                    };
                    // we need to use the scope here because of ng-repeat.
                    scope.entries = list.getEntries();

                    renderList();

                    $rootScope.$on('filter', (event, { type, data = {} }) => {
                        if (type === 'spamlist.update' && listType === data.name) {
                            scope.entries = data.entries;
                            renderList();
                        }
                    });

                    const onScroll = _.throttle(() => {

                        if (!list.hasMoreData() || list.isFetchingData()) {
                            return;
                        }

                        const elementCount = scope.entries.length;
                        const triggerFetch = elementCount - TRIGGER_BOUNDARY;

                        const scrollBottom = tbody.scrollTop + tbody.clientHeight;

                        // check if we have reached the last TRIGGER_BOUNDARY elements
                        if (scrollBottom / tbody.scrollHeight > triggerFetch / elementCount) {
                            list.fetchMoreData();
                        }

                    }, SCROLL_THROTTLE);

                    unsubscribe.push(onEvent(tbody, 'scroll', onScroll));

                    scope.$on('$destroy', () => {
                        _.each(unsubscribe, (cb) => cb());
                        unsubscribe.length = 0;
                    });


                };
            }
        };
    });
