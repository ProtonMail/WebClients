angular.module('proton.commons')
    .directive('appConfigBody', ($rootScope, AppModel) => {

        const className = (key = '') => `appConfigBody-${key}`;
        const mapClassNames = {
            mobile: className('is-mobile'),
            requestTimeout: className('request-timeout'),
            tourActive: className('tourActive'),
            activeComposer: className('activeComposer'),
            maximizedComposer: className('maximizedComposer'),
            modalOpen: className('modalOpen'),
            showSidebar: className('showSidebar')
        };

        return {
            link(scope, el) {
                AppModel.is('mobile') && el[0].classList.add(mapClassNames.mobile);

                const toggleClass = (className, data = {}) => {
                    const method = data.value ? 'add' : 'remove';
                    _rAF(() => el[0].classList[method](className));
                };

                $rootScope.$on('AppModel', (e, { type, data }) => {
                    const className = mapClassNames[type];
                    className && toggleClass(className, data);
                });

                $rootScope.$on('$stateChangeSuccess', (e, toState) => {
                    el[0].id = toState.name.replace('.', '-');
                });
            }
        };
    });
