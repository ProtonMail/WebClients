angular.module('proton.commons')
    .directive('appConfigBody', ($rootScope, AppModel) => {

        const CLASS_IS_MOBILE = 'appConfigBody-is-mobile';
        const CLASS_TIMEOUT = 'appConfigBody-request-timeout';

        return {
            link(scope, el) {
                AppModel.is('mobile') && el[0].classList.add(CLASS_IS_MOBILE);

                $rootScope.$on('AppModel', (e, { type, data }) => {
                    switch (type) {
                        case 'mobile': {
                            const method = data.value ? 'add' : 'remove';
                            _rAF(() => el[0].classList[method](CLASS_IS_MOBILE));
                            break;
                        }
                        case 'requestTimeout': {
                            const method = data.value ? 'add' : 'remove';
                            _rAF(() => el[0].classList[method](CLASS_TIMEOUT));
                            break;
                        }
                    }
                });
            }
        };
    });
