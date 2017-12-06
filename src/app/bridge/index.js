import bridgeFreePanel from './directives/bridgeFreePanel';
import bridgePaidPanel from './directives/bridgePaidPanel';
import bridgeView from './directives/bridgeView';

export default angular
    .module('proton.bridge', [])
    .directive('bridgeFreePanel', bridgeFreePanel)
    .directive('bridgePaidPanel', bridgePaidPanel)
    .directive('bridgeView', bridgeView).name;
