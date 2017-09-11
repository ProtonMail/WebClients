angular.module('proton.ui')
    .directive('chooseLayoutBtns', ($rootScope, authentication, CONSTANTS, networkActivityTracker, tools, settingsApi, eventManager, notification, gettextCatalog) => {

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
                const promise = settingsApi.setViewlayout({ ViewLayout: newLayout })
                    .then(({ data = {} } = {}) => {
                        if (data.Code === 1000) {
                            return eventManager.call()
                                .then(() => {
                                    $rootScope.$emit('settings', { type: 'viewLayout.updated', data: { viewLayout: newLayout } });
                                    tools.mobileResponsive();
                                    notification.success(gettextCatalog.getString('Layout saved', null));
                                });
                        }

                        if (data.Error) {
                            return notification.error(data.Error);
                        }

                        notification.error('Error during saving layout mode');
                    });
                networkActivityTracker.track(promise);
            }

            angular.element('.toolbarDesktop-container').find('a').tooltip('hide');
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
