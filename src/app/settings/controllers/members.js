import _ from 'lodash';

/* @ngInject */
function MembersController($controller, $scope, $stateParams, authentication, memberActions, memberModel) {
    $controller('SignaturesController', { $scope, authentication });

    function scrollToUsers() {
        $('.settings').animate(
            {
                scrollTop: $('#settingsMembers').offset().top
            },
            1000
        );
    }

    $scope.roles = memberModel.getRoles();

    switch ($stateParams.action) {
        case 'new':
            memberActions.add();
            break;
        case 'edit':
            memberActions.edit(_.find($scope.members, { ID: $stateParams.id }));
            break;
        case 'scroll':
            scrollToUsers();
            break;
        default:
            break;
    }
}
export default MembersController;
