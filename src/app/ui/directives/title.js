angular.module('proton.ui')
    .directive('title', ($rootScope, pageTitlesModel) => {

        const bindTitle = (el, title) => el.text(title);

        return {
            restrict: 'E',
            scope: {},
            link(scope, el) {

                $rootScope.$on('updatePageName', () => {
                    bindTitle(el, pageTitlesModel.find());
                });

                $rootScope.$on('$stateChangeSuccess', (e, state) => {
                    bindTitle(el, pageTitlesModel.find(state));
                });
            }
        };

    });
