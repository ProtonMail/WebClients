import CONFIG from '../../config';

/* @ngInject */
function asideSidebar(userType) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/layout/asideSidebar.tpl.html'),
        scope: {},
        link(scope) {
            scope.hasCalendar = CONFIG.featureFlags.includes('calendar') && userType().isPaid;
        }
    };
}

export default asideSidebar;
