angular.module('proton.ui')
    .directive('chooseLayoutBtns', (authentication, CONSTANTS, networkActivityTracker, tools, Setting, eventManager, notify, gettextCatalog) => {

        const notif = (message = '', type = 'success') => notify({ message, classes: `notification-${type}` });

        const getLayout = (mode) => {
            if (mode === 'rows' && authentication.user.ViewLayout === CONSTANTS.COLUMN_MODE) {
                return 1;
            }

            if (mode === 'columns' && authentication.user.ViewLayout === CONSTANTS.ROW_MODE) {
                return 0;
            }
        };

        const changeTo = (mode) => {
            const newLayout = getLayout(mode);

            if (angular.isDefined(newLayout)) {
                const promise = Setting.setViewlayout({ ViewLayout: newLayout })
                    .then(({ data = {} } = {}) => {
                        if (data.Code === 1000) {
                            return eventManager.call()
                                .then(() => {
                                    tools.mobileResponsive();
                                    notif(gettextCatalog.getString('Layout saved', null));
                                });
                        }

                        if (data.Error) {
                            return notif(data.Error, 'danger');
                        }

                        notif('Error during saving layout mode', 'danger');
                    });
                networkActivityTracker.track(promise);
            }

            angular.element('#pm_toolbar-desktop').find('a').tooltip('hide');
        };

        return {
            replace: true,
            templateUrl: 'templates/ui/chooseLayoutBtns.tpl.html',
            link(scope, el) {
                const $a = el.find('a');
                const onClick = (e) => {
                    e.preventDefault();
                    changeTo(e.target.getAttribute('data-action'));
                };
                $a.on('click', onClick);

                scope.$on('$destroy', () => {
                    $a.off('click', onClick);
                });
            }
        };
    });
