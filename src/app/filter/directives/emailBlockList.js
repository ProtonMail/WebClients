angular.module('proton.filter')
    .directive('emailBlockList', ($rootScope, spamListModel, gettextCatalog) => {

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

        const onEvent = (element, type, callback) => {
            element.addEventListener(type, callback);
            return () => element.removeEventListener(type, callback);
        };

        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/emailBlockList.tpl.html',
            scope: {},
            link(scope, elem, { switchTo, listType }) {

                const unsubscribe = [];
                const type = spamListModel.getType(listType);
                const tbody = elem[0].querySelector(`.${CLASSNAMES.LIST}`);

                scope.filterName = I18N[listType];

                spamListModel.getList(type)
                    .then((list) => {
                        scope.$applyAsync(() => scope.entries = list);
                    });


                unsubscribe.push($rootScope.$on('filters', () => {
                    spamListModel.getList(type)
                        .then((list) => {
                            scope.$applyAsync(() => {
                                scope.entries = _.uniq(list);
                                $('.tooltip').hide();
                            });
                        });
                }));


                const onScroll = _.throttle(() => {
                    if (spamListModel.isLoading(type) || spamListModel.isEnding(type)) {
                        return;
                    }

                    const elementCount = scope.entries.length;
                    const triggerFetch = elementCount - TRIGGER_BOUNDARY;
                    const scrollBottom = tbody.scrollTop + tbody.clientHeight;

                    // check if we have reached the last TRIGGER_BOUNDARY elements
                    if (scrollBottom / tbody.scrollHeight > triggerFetch / elementCount) {
                        spamListModel.getList(type)
                            .then((list) => {
                                scope.$applyAsync(() => {
                                    scope.entries = _.uniq(scope.entries.concat(list));
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

                unsubscribe.push(onEvent(tbody, 'scroll', onScroll));
                unsubscribe.push(onEvent(elem[0], 'click', onClick));


                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                    spamListModel.clear();
                });

            }
        };

    });
