/* @ngInject */
function SidebarController($scope, AppModel, dispatchers) {
    const bindAppValue = (key, { value }) => $scope.$applyAsync(() => ($scope[key] = value));
    const { on, unsubscribe } = dispatchers();
    $scope.inboxSidebar = AppModel.is('inboxSidebar');
    $scope.showSidebar = AppModel.is('showSidebar');
    $scope.settingsSidebar = AppModel.is('settingsSidebar');
    $scope.contactSidebar = AppModel.is('contactSidebar');
    $scope.mobileMode = AppModel.is('mobile');

    on('AppModel', (e, { type, data = {} }) => {
        type === 'mobile' && bindAppValue('mobileMode', data);
        if (/^(show|inbox|settings|contact)Sidebar$/.test(type)) {
            bindAppValue(type, data);
        }
    });

    $scope.$on('$destroy', () => {
        unsubscribe();
    });
}

export default SidebarController;
