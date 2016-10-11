angular.module('proton.core')
    .directive('protonLoader', ($rootScope) => ({
        replace: true,
        scope: {},
        templateUrl: 'templates/directives/core/protonLoader.tpl.html',
        link(scope, el) {
            $rootScope
                .$on('networkActivity', (e, type) => {
                    (type === 'load') && _rAF(() => el[0].classList.add('show'));
                    (type === 'close') && _rAF(() => el[0].classList.remove('show'));
                });
        }
    }));
