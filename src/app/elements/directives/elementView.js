/* @ngInject */
const elementView = (tools) => ({
    restrict: 'E',
    template: `<div><conversation-view ng-if="type === 'conversation'"></conversation-view><message-view ng-if="type === 'message'"></message-view></div>`,
    replace: true,
    link(scope) {
        scope.type = tools.typeView();
    }
});
export default elementView;
