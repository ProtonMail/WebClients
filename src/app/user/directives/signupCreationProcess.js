angular.module('proton.user')
    .directive('signupCreationProcess', ($rootScope) => {

        const ACTIONS = {
            'create.user': 'creation',
            loguserin: 'loggedin',
            'setup.account': 'setupaccount',
            'user.get': 'userready',
            'user.finish': 'done'
        };

        return {
            replace: true,
            scope: {},
            templateUrl: 'templates/user/signupCreationProcess.tpl.html',
            link(scope) {

                scope.flow = {};
                const unsubscribe = $rootScope.$on('signup', (e, { type, data }) => {
                    if (ACTIONS[type]) {
                        return scope.$applyAsync(() => scope.flow[ACTIONS[type]] = data.value);
                    }
                    (type === 'signup.error') && scope.$applyAsync(() => scope.signupError = data.value);
                });

                scope.$on('$destroy', () => {
                    unsubscribe();
                });
            }
        };
    });
