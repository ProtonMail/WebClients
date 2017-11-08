angular.module('proton.settings')
    .controller('MembersController', (
        $controller,
        $scope,
        $stateParams,
        authentication,
        pmcw,
        memberActions,
        memberModel
    ) => {
        $controller('SignaturesController', { $scope, authentication, pmcw });

        function scrollToUsers() {
            $('.settings').animate({
                scrollTop: $('#settingsMembers').offset().top
            }, 1000);
        }

        $scope.roles = memberModel.getRoles();

        switch ($stateParams.action) {
            case 'new':
                memberActions.add();
                break;
            case 'edit':
                memberActions.edit(_.findWhere($scope.members, { ID: $stateParams.id }));
                break;
            case 'scroll':
                scrollToUsers();
                break;
            default:
                break;
        }
    });
