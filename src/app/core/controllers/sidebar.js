/* @ngInject */
function SidebarController($scope, AppModel, dispatchers) {
    const bindAppValue = (key, { value }) => $scope.$applyAsync(() => ($scope[key] = value));
    const { on, unsubscribe } = dispatchers();
    $scope.showSidebar = AppModel.is('showSidebar');
    $scope.mobileMode = AppModel.is('mobile');

    on('AppModel', (e, { type, data = {} }) => {
        type === 'mobile' && bindAppValue('mobileMode', data);
        if (type === 'showSidebar') {
            bindAppValue(type, data);
        }
    });

    $scope.$on('$destroy', () => {
        unsubscribe();
    });
}

export default SidebarController;
