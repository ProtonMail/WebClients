angular.module('proton.filter')
    .directive('emailBlockList', ($rootScope, spamListModel) => {

        // In milliseconds
        const SCROLL_THROTTLE = 100;
        // fetch when less than TRIGGER_BOUNDARY entries are below the bottom of the table view
        const TRIGGER_BOUNDARY = 50;

        const onEvent = (element, type, delegate, handler) => {
            element.on(type, delegate, handler);
            return () => element.off(type, delegate, handler);
        };

        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/emailBlockList.tpl.html',
            scope: {},
            compile(elem, { filterName, listType }) {

                const filterNameNodes = elem[0].querySelectorAll('.email-block-list-name');
                _.each(filterNameNodes, (node) => node.textContent = filterName);

                const addButton = elem[0].querySelector('email-block-button');
                addButton.dataset.targetList = listType;

                // link
                return (scope, elem, { switchTo }) => {
                    const unsubscribe = [];

                    const list = spamListModel.getList(listType);
                    const switchList = spamListModel.getList(switchTo);
                    // we need the jquery for delegates
                    const tbody = elem.find('.block-list > table > tbody');

                    // we need to use the scope here because of ng-repeat.
                    scope.entries = list.getEntries();

                    const onScroll = _.throttle(() => {
                        if (!list.hasMoreData() || list.isFetchingData()) {
                            return;
                        }

                        const elementCount = scope.entries.length;
                        const triggerFetch = elementCount - TRIGGER_BOUNDARY;
                        const scrollBottom = tbody.scrollTop() + tbody.innerHeight();

                        // check if we have reached the last TRIGGER_BOUNDARY elements
                        if (scrollBottom / tbody[0].scrollHeight > triggerFetch / elementCount) {
                            list.fetchMoreData();
                        }

                    }, SCROLL_THROTTLE);

                    unsubscribe.push($rootScope.$on('filter', (event, { type, data = {} }) => {
                        if (type === 'spamlist.update' && listType === data.name) {
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

                    const getId = (subElement) => $(subElement).closest('tr').data('entryId');

                    const onSwitch = ({ target }) => switchList.adopt(getId(target));
                    const onDelete = ({ target }) => spamListModel.deleteEntry(getId(target));

                    unsubscribe.push(onEvent(tbody, 'scroll', null, onScroll));
                    unsubscribe.push(onEvent(tbody, 'click', '.blocklist-email-switch', onSwitch));
                    unsubscribe.push(onEvent(tbody, 'click', '.blocklist-email-delete', onDelete));

                    scope.$on('$destroy', () => {
                        _.each(unsubscribe, (cb) => cb());
                        unsubscribe.length = 0;
                    });

                };
            }
        };
    });
