/* @ngInject */
const elementView = (tools) => ({
    restrict: 'E',
    template: `
    <conversation-view ng-if="type === 'conversation'"></conversation-view>
    <message-view ng-if="type === 'message'"></message-view>
    `,
    link(scope) {
        scope.type = tools.typeView();
    }
});
export default elementView;
