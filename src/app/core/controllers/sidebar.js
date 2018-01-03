/* @ngInject */
function SidebarController($rootScope, $scope, AppModel) {
    const bindAppValue = (key, { value }) => $scope.$applyAsync(() => ($scope[key] = value));
    $scope.inboxSidebar = AppModel.is('inboxSidebar');
    $scope.showSidebar = AppModel.is('showSidebar');
    $scope.settingsSidebar = AppModel.is('settingsSidebar');
    $scope.contactSidebar = AppModel.is('contactSidebar');
    $scope.mobileMode = AppModel.is('mobile');

    const unsubscribe = $rootScope.$on('AppModel', (e, { type, data = {} }) => {
        type === 'mobile' && bindAppValue('mobileMode', data);
        type === 'showSidebar' && bindAppValue(type, data);
        type === 'inboxSidebar' && bindAppValue(type, data);
        type === 'settingsSidebar' && bindAppValue(type, data);
        type === 'contactSidebar' && bindAppValue(type, data);
    });

    $scope.$on('$destroy', () => {
        unsubscribe();
    });
}

export default SidebarController;
