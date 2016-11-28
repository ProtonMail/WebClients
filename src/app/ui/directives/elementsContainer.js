angular.module('proton.ui')
.directive('elementsContainer', ($rootScope) => {
    const minute = 60 * 1000;
    return {
        restrict: 'A',
        link(scope) {
            const intervalId = setInterval(() => $rootScope.$emit('refreshTimeElement'), minute);
            scope.$on('$destroy', () => clearInterval(intervalId));
        }
    };
});
