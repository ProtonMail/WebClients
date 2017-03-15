angular.module('proton.ui')
    .directive('title', ($rootScope, pageTitlesModel, $state) => {

        const bindTitle = (el, title) => el.text(title);

        return {
            restrict: 'E',
            scope: {},
            link(scope, el) {
                $rootScope.$on('$stateChangeSuccess', (e, state) => {
                    bindTitle(el, pageTitlesModel.find(state));
                });

                // Update the counter
                $rootScope.$on('elements', (e, { type }) => {
                    (type === 'refresh' && !$state.is('secured.label.element')) && bindTitle(el, pageTitlesModel.find($state.current));
                });
            }
        };

    });
