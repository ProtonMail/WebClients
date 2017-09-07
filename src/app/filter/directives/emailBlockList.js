angular.module('proton.filter')
    .directive('emailBlockList', ($rootScope, spamListModel) => {

        // In milliseconds
        const SCROLL_THROTTLE = 100;
        // fetch when less than TRIGGER_BOUNDARY entries are below the bottom of the table view
        const TRIGGER_BOUNDARY = 50;
        const CLASSNAMES = {
            LIST: 'emailBlockList-list',
            BTN_SWITCH: 'emailBlockList-btn-switch',
            BTN_DELETE: 'emailBlockList-btn-delete'
        };

        const onEvent = (element, type, callback) => {
            element.addEventListener(type, callback);
            return () => element.removeEventListener(type, callback);
        };

        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/emailBlockList.tpl.html',
            scope: {
                filterName: '@',
                listType: '@'
            },
            link(scope, elem, { switchTo }) {
                const unsubscribe = [];

                const list = spamListModel.getList(scope.listType);
                const switchList = spamListModel.getList(switchTo);
                const tbody = elem[0].querySelector(`.${CLASSNAMES.LIST}`);

                // we need to use the scope here because of ng-repeat.
                scope.entries = list.getEntries();

                unsubscribe.push($rootScope.$on('filter', (event, { type, data = {} }) => {
                    if (type === 'spamlist.update' && scope.listType === data.name) {
                        if ('appended' in data) {
                            // shortcut in case of appending: make sure angular doesn't render the whole table again
                            scope.$applyAsync(() => scope.entries.push(...data.appended));
                            return;
                        }
                        /*
                         * Can be any change. We don't want to send a sillion different event types for weird updates,
                         * so we just assign the value). Also these updates happen after you click a button: a lag is not really noticed.
                         */
                        scope.$applyAsync(() => {
                            scope.entries = data.entries;

                            $('.tooltip').hide();
                        });
                    }
                }));


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


                const onClick = ({ target }) => {

                    if (target.nodeName !== 'BUTTON') {
                        return;
                    }

                    if (target.classList.contains(CLASSNAMES.BTN_SWITCH)) {
                        switchList.adopt(target.dataset.entryId);
                    }

                    if (target.classList.contains(CLASSNAMES.BTN_DELETE)) {
                        spamListModel.deleteEntry(target.dataset.entryId);
                    }
                };

                unsubscribe.push(onEvent(tbody, 'scroll', onScroll));
                unsubscribe.push(onEvent(elem[0], 'click', onClick));


                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                });

            }
        };

    });
