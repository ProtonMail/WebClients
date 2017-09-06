angular.module('proton.filter')
    .directive('emailBlockButton', (filterAddressModal, notify, gettextCatalog, spamListModel) => {

        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/emailBlockButton.tpl.html',
            scope: {},
            link(scope, elem, { targetList }) {

                const unsubscribe = [];

                const list = spamListModel.getList(targetList);

                const onClick = () => {
                    filterAddressModal.activate({
                        params: {
                            list: targetList,
                            add(email) {
                                list.add(email);
                                filterAddressModal.deactivate();
                            },
                            close() {
                                filterAddressModal.deactivate();
                            }
                        }
                    });
                };

                elem.on('click', onClick);

                unsubscribe.push(() => elem.off('click', onClick));

                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
