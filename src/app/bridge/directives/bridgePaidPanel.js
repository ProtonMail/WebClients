/* @ngInject */
function bridgePaidPanel() {
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: require('../../../templates/bridge/bridgePaidPanel.tpl.html')
    };
}
export default bridgePaidPanel;
