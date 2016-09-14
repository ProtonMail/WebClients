angular.module('proton.core')
    .directive('protonLoader', ($rootScope, networkActivityTracker) => ({
        replace: true,
        scope: {},
        templateUrl: 'templates/directives/core/protonLoader.tpl.html',
        link(scope, el) {
            $rootScope
                .$on('networkActivity', (e, type) => {
                    ('load' === type) && _rAF(() => el[0].classList.add('show'));
                    ('close' === type) && _rAF(() => el[0].classList.remove('show'));
                });
        }
    }));