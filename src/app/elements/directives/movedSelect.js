angular.module('proton.elements')
    .directive('movedSelect', ($rootScope, authentication, gettextCatalog, networkActivityTracker, settingsApi) => {
        const I18N = {
            includeMoved: gettextCatalog.getString('Include Moved', null, 'Option'),
            hideMoved: gettextCatalog.getString('Hide Moved', null, 'Option')
        };
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            template: `
            <span class="movedSelect-container pm_select inline">
                <select class="movedSelect-select">
                    <option value="3">${I18N.includeMoved}</option>
                    <option value="0">${I18N.hideMoved}</option>
                </select>
                <i class="fa fa-angle-down"></i>
            </span>
            `,
            link(scope, element) {
                const $select = element.find('select');
                const set = (moved) => $select.val(+moved);
                const get = () => ~~$select.val();
                const unsubscribe = $rootScope.$on('updateUser', () => set(authentication.user.Moved));

                function onChange() {
                    const Moved = get();
                    const promise = settingsApi.updateMoved({ Moved })
                        .then(({ data = {} } = {}) => {
                            if (data.Code === 1000) {
                                authentication.user.Moved = Moved;
                                return data;
                            }
                            throw new Error(data.Error);
                        });
                    networkActivityTracker.track(promise);
                }

                set(authentication.user.Moved);
                $select.on('change', onChange);

                scope.$on('$destroy', () => {
                    unsubscribe();
                    $select.off('change', onChange);
                });
            }
        };
    });
